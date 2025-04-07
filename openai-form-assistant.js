import { i, _, s, e, y, a } from './query-assigned-elements-8a604587.js';

// Define styles for the OpenAI Chat Assistant
const baseStyle = i`
  :host {
    height: 100%;
    width: 100%;
    display: block;
    font-family: sans-serif;
  }
`;

const chatAssistantStyles = i`
  .container {
    margin: 10px 0;
  }
  
  .chat-container {
    border: 1px solid #ccc;
    border-radius: 8px;
    padding: 16px;
    max-height: 400px;
    overflow-y: auto;
    margin-bottom: 16px;
    background-color: #f9f9f9;
  }
  
  .chat-message {
    margin-bottom: 12px;
    padding: 8px 12px;
    border-radius: 6px;
    max-width: 80%;
  }
  
  .user-message {
    background-color: #e1f5fe;
    margin-left: auto;
  }
  
  .assistant-message {
    background-color: #f1f1f1;
  }
  
  .input-container {
    display: flex;
    gap: 8px;
  }
  
  input {
    flex-grow: 1;
    padding: 8px;
    border-radius: 4px;
    border: 1px solid #ccc;
  }
  
  button {
    padding: 8px 16px;
    background-color: #0078d4;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  
  button:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
  
  .loading {
    display: inline-block;
    width: 20px;
    height: 20px;
    border: 3px solid rgba(0, 0, 0, 0.1);
    border-radius: 50%;
    border-top-color: #0078d4;
    animation: spin 1s ease infinite;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  .hidden {
    display: none;
  }
  
  label {
    font-weight: bold;
    margin-bottom: 8px;
    display: block;
  }
  
  .hint {
    color: #666;
    font-size: 0.9em;
    margin-top: 4px;
  }
`;

const styles = [baseStyle, chatAssistantStyles];

// Define the OpenAI Chat Assistant component using the same pattern as the working example
_({ kind: "class", elements: [{ kind: "field", decorators: [e({ type: String })], key: "label", value() { return 'OpenAI Chat Assistant'; } }, { kind: "field", decorators: [e({ type: String })], key: "hint", value() { return 'Ask questions about your form data'; } }, { kind: "field", decorators: [e({ type: Boolean })], key: "required", value() { return false; } }, { kind: "field", decorators: [e({ type: Boolean })], key: "readOnly", value() { return false; } }, { kind: "field", decorators: [e({ type: Boolean })], key: "visible", value() { return true; } }, { kind: "field", decorators: [e({ type: Boolean })], key: "disabled", value() { return false; } }, { kind: "field", decorators: [e({ type: String })], key: "apiKey", value() { return ''; } }, { kind: "field", decorators: [e({ type: String })], key: "model", value() { return 'gpt-3.5-turbo'; } }, { kind: "field", decorators: [e({ type: String })], key: "tableReferences", value() { return '[]'; } }, { kind: "field", key: "userPrompt", value() { return ''; } }, { kind: "field", key: "chatHistory", value() { return []; } }, { kind: "field", key: "isLoading", value() { return false; } }, { kind: "get", static: true, key: "styles", value: function styles$1() { return styles; } }, 
{ kind: "method", static: true, key: "getMetaConfig", value: function getMetaConfig() {
  return {
    controlName: 'OpenAI Chat Assistant',
    fallbackDisableSubmit: false,
    version: '1.0',
    properties: {
      label: {
        title: 'Label',
        description: 'Control label displayed to the user',
        type: 'string',
        defaultValue: 'OpenAI Chat Assistant'
      },
      hint: {
        title: 'Hint',
        description: 'Help text for the control',
        type: 'string',
        defaultValue: 'Ask questions about your form data'
      },
      apiKey: {
        title: 'OpenAI API Key',
        description: 'Your OpenAI API key (securely stored)',
        type: 'string',
        isSecureString: true
      },
      model: {
        title: 'OpenAI Model',
        description: 'Which OpenAI model to use',
        type: 'string',
        enum: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4o'],
        defaultValue: 'gpt-3.5-turbo'
      },
      tableReferences: {
        title: 'Data Tables',
        description: 'JSON array of table references',
        type: 'string',
        defaultValue: '[]'
      }
    },
    events: {
      "ntx-value-change": {
        title: "Value changed",
        description: "Value changed"
      }
    },
    standardProperties: {
      readOnly: true,
      required: true,
      visibility: true
    }
  };
} },
// Event handlers and methods
{ kind: "method", key: "updated", value: function updated(changedProps) {
  if (changedProps.has("tableReferences")) {
    try {
      // Parse the tableReferences JSON string when it changes
      JSON.parse(this.tableReferences);
    } catch (e) {
      console.error("Error parsing tableReferences:", e);
    }
  }
} }, 
{ kind: "method", key: "handleInput", value: function handleInput(e) {
  this.userPrompt = e.target.value;
} },
{ kind: "method", key: "handleKeyDown", value: function handleKeyDown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    this.handleSendMessage();
  }
} },
{ kind: "method", key: "handleSendMessage", value: async function handleSendMessage() {
  if (!this.userPrompt.trim() || this.isLoading) {
    return;
  }

  const userMessage = this.userPrompt.trim();
  this.chatHistory = [...this.chatHistory, { role: 'user', content: userMessage }];
  this.userPrompt = '';
  this.isLoading = true;
  this.requestUpdate();

  try {
    // Get the form context
    const formContext = this.getRootNode().host?.formContext || window.formContext;
    
    // Create context with table data
    const contextResult = await this.createOpenAIContext(
      JSON.parse(this.tableReferences),
      formContext
    );
    
    if (!contextResult.success) {
      this.chatHistory = [...this.chatHistory, { 
        role: 'assistant', 
        content: `Error accessing tables: ${contextResult.error}` 
      }];
      this.isLoading = false;
      this.requestUpdate();
      return;
    }
    
    // Send message to OpenAI with context
    const response = await this.executeTableQuery(
      this.apiKey,
      this.model,
      userMessage,
      contextResult.context
    );

    if (!response.success) {
      this.chatHistory = [...this.chatHistory, { 
        role: 'assistant', 
        content: `Error: ${response.error}` 
      }];
    } else {
      this.chatHistory = [...this.chatHistory, { 
        role: 'assistant', 
        content: response.response 
      }];
    }
  } catch (error) {
    console.error('Error handling message:', error);
    this.chatHistory = [...this.chatHistory, { 
      role: 'assistant', 
      content: `Error: ${error.message}` 
    }];
  } finally {
    this.isLoading = false;
    this.requestUpdate();
  }
} },
// Render methods
{ kind: "method", key: "render", value: function render() {
  return y`
    <div class="container ${!this.visible ? 'hidden' : ''}">
      <label>${this.label}</label>
      
      <div class="chat-container">
        ${this.chatHistory.map(message => y`
          <div class="chat-message ${message.role === 'user' ? 'user-message' : 'assistant-message'}">
            ${message.content}
          </div>
        `)}
        
        ${this.isLoading ? y`
          <div class="chat-message assistant-message">
            <div class="loading"></div> Thinking...
          </div>
        ` : ''}
      </div>
      
      <div class="input-container">
        <input 
          type="text" 
          .value="${this.userPrompt}"
          @input="${this.handleInput}"
          @keydown="${this.handleKeyDown}"
          placeholder="Ask a question about your form data..."
          ?disabled="${this.disabled || this.readOnly}"
        />
        <button 
          @click="${this.handleSendMessage}" 
          ?disabled="${this.disabled || this.readOnly || this.isLoading}"
        >
          Send
        </button>
      </div>
      
      ${this.hint ? y`<div class="hint">${this.hint}</div>` : ''}
    </div>
  `;
} },
// API and data handling methods
{ kind: "method", key: "fetchTableData", value: async function fetchTableData(tableName, formContext) {
  try {
    if (!formContext) {
      throw new Error('Form context is not available');
    }

    // Get the tenant URL and authentication token
    const baseUrl = formContext.tenant?.url || window.location.origin;
    let authToken = formContext.authentication?.token;
    
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
    
    // Now fetch the table data
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
    
    // Format the data
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
} },
{ kind: "method", key: "getAvailableTables", value: async function getAvailableTables(formContext) {
  try {
    // Check if the traditional API is available
    if (formContext?.tables?.getAllTables) {
      const tables = await formContext.tables.getAllTables();
      return {
        success: true,
        tables: tables.map(table => ({
          name: table.name,
          displayName: table.displayName,
          description: table.description
        }))
      };
    }
    
    // If not, try the REST API approach
    const baseUrl = formContext.tenant?.url || window.location.origin;
    const authToken = formContext.authentication?.token;
    
    if (!authToken) {
      return { 
        success: false,
        error: 'Authentication token not available' 
      };
    }
    
    const response = await fetch(`${baseUrl}/api/v1/tables`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch tables: ${response.statusText}`);
    }
    
    const tablesData = await response.json();
    
    return {
      success: true,
      tables: tablesData.items.map(table => ({
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
} },
{ kind: "method", key: "createOpenAIContext", value: async function createOpenAIContext(tableReferences, formContext) {
  const context = {
    tables: {},
    tableNames: [],
    error: null
  };

  try {
    // If no tables are specified, try to get all available tables
    if (!tableReferences || tableReferences.length === 0) {
      const availableTables = await this.getAvailableTables(formContext);
      
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
      
      const tableData = await this.fetchTableData(tableRef.tableName, formContext);
      
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
} },
{ kind: "method", key: "executeTableQuery", value: async function executeTableQuery(apiKey, model, userQuery, context) {
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
} }] }, s, "openai-chat-assistant");

// Export the component so it can be accessed from other files
export { OpenAIChatAssistant };
