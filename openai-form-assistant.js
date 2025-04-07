/**
 * This file contains the implementation for integrating with Nintex Data Tables
 * It provides functions to:
 * 1. Access table data using the Nintex APIs
 * 2. Format data for OpenAI prompts
 * 3. Parse results and handle responses
 */

/**
 * Fetches data from a Nintex Data Table using the REST API
 * @param {string} tableName - The name of the table to fetch data from
 * @param {Object} formContext - The Nintex form context object
 * @returns {Promise<Object>} - The table data or error
 */
export async function fetchTableData(tableName, formContext) {
  try {
    if (!formContext) {
      throw new Error('Form context is not available');
    }

    // First try to get the table information to ensure we have the right ID
    // Based on the screenshot, we need to make a proper REST call to the Nintex API
    
    // We need to get the tenant URL and authentication token from the form context
    const baseUrl = formContext.tenant?.url || window.location.origin;
    const authToken = formContext.authentication?.token;
    
    if (!authToken) {
      // Fallback to check if we can get authentication from the window context
      const authContext = window.NWC?.Authentication;
      if (authContext && typeof authContext.getAuthToken === 'function') {
        const tokenResult = await authContext.getAuthToken();
        if (tokenResult.success) {
          authToken = tokenResult.token;
        }
      }
      
      if (!authToken) {
        throw new Error('Authentication token not available');
      }
    }
    
    // First fetch the table metadata to get its ID
    const tableMetadataResponse = await fetch(`${baseUrl}/api/v1/tables`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    if (!tableMetadataResponse.ok) {
      throw new Error(`Failed to fetch tables: ${tableMetadataResponse.statusText}`);
    }
    
    const tablesData = await tableMetadataResponse.json();
    const targetTable = tablesData.items.find(table => 
      table.name.toLowerCase() === tableName.toLowerCase() || 
      table.displayName.toLowerCase() === tableName.toLowerCase()
    );
    
    if (!targetTable) {
      throw new Error(`Table '${tableName}' not found`);
    }
    
    // Now fetch the table data using the table ID
    const tableDataResponse = await fetch(`${baseUrl}/api/v1/tables/${targetTable.id}/data`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    if (!tableDataResponse.ok) {
      throw new Error(`Failed to fetch table data: ${tableDataResponse.statusText}`);
    }
    
    const tableData = await tableDataResponse.json();
    
    // Format the data for easier processing
    return {
      success: true,
      metadata: {
        id: targetTable.id,
        name: targetTable.name,
        displayName: targetTable.displayName,
        columns: targetTable.columns?.map(col => ({
          name: col.name,
          displayName: col.displayName,
          type: col.type
        })) || []
      },
      data: tableData.items || []
    };
  } catch (error) {
    console.error(`Error fetching table data for ${tableName}:`, error);
    return { 
      success: false,
      error: error.message 
    };
  }
}

/**
 * Gets all available tables from the form context
 * @param {Object} formContext - The Nintex form context
 * @returns {Promise<Array>} - List of available tables
 */
export async function getAvailableTables(formContext) {
  try {
    if (!formContext || !formContext.tables || !formContext.tables.getAllTables) {
      return { 
        success: false,
        error: 'Tables API not available in this context' 
      };
    }

    const tables = await formContext.tables.getAllTables();
    
    return {
      success: true,
      tables: tables.map(table => ({
        name: table.name,
        displayName: table.displayName,
        description: table.description
      }))
    };
  } catch (error) {
    console.error('Error getting available tables:', error);
    return { 
      success: false,
      error: error.message 
    };
  }
}

/**
 * Creates a context object for OpenAI with table data
 * @param {Array} tableReferences - Array of table references defined in the plugin
 * @param {Object} formContext - The Nintex form context
 * @returns {Promise<Object>} - Context object with table data
 */
export async function createOpenAIContext(tableReferences, formContext) {
  const context = {
    tables: {},
    tableNames: [],
    error: null
  };

  try {
    // If no tables are specified, try to get all available tables
    if (!tableReferences || tableReferences.length === 0) {
      const availableTables = await getAvailableTables(formContext);
      
      if (!availableTables.success) {
        throw new Error(availableTables.error);
      }
      
      tableReferences = availableTables.tables.map(table => ({
        tableName: table.name,
        alias: table.displayName
      }));
    }
    
    // Fetch data for each table
    for (const tableRef of tableReferences) {
      const alias = tableRef.alias || tableRef.tableName;
      context.tableNames.push(alias);
      
      const tableData = await fetchTableData(tableRef.tableName, formContext);
      
      if (!tableData.success) {
        throw new Error(`Error fetching data from ${tableRef.tableName}: ${tableData.error}`);
      }
      
      context.tables[alias] = {
        metadata: tableData.metadata,
        data: tableData.data
      };
    }
    
    return {
      success: true,
      context
    };
  } catch (error) {
    console.error('Error creating OpenAI context:', error);
    return {
      success: false,
      error: error.message,
      context
    };
  }
}

/**
 * Executes a query against table data using OpenAI
 * @param {string} apiKey - OpenAI API key
 * @param {string} model - OpenAI model to use
 * @param {string} userQuery - The user's natural language query
 * @param {Object} context - The context object with table data
 * @returns {Promise<Object>} - The query result
 */
export async function executeTableQuery(apiKey, model, userQuery, context) {
  try {
    if (!apiKey) {
      throw new Error('OpenAI API key is required');
    }

    if (!context || !context.tables || Object.keys(context.tables).length === 0) {
      throw new Error('No table data available to query');
    }

    // Format the system prompt with table information
    let systemPrompt = `You are a helpful assistant that can analyze Nintex form data tables. You have access to the following tables:\n\n`;
    
    for (const [tableName, tableData] of Object.entries(context.tables)) {
      systemPrompt += `Table: ${tableName}\n`;
      systemPrompt += `Columns: ${tableData.metadata.columns.map(col => `${col.displayName} (${col.type})`).join(', ')}\n`;
      systemPrompt += `Row count: ${tableData.data.length}\n\n`;
    }
    
    systemPrompt += `When asked about the data, respond with accurate information based on the table data provided. If asked to perform calculations or aggregations, do so correctly. If the question cannot be answered with the available data, explain why.`;

    // Format the user prompt with the table data and query
    const userPrompt = `Given the following Nintex table data:\n\n${JSON.stringify(context.tables)}\n\nMy question is: ${userQuery}`;

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model || 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3 // Lower temperature for more factual responses
      })
    });

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message || 'Error calling OpenAI API');
    }

    return {
      success: true,
      response: data.choices[0].message.content,
      usage: data.usage
    };
  } catch (error) {
    console.error('Error executing table query:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
