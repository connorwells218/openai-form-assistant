/**
 * OpenAI Chat Assistant for Nintex Forms
 * 
 * This plugin allows users to ask natural language questions about data in Nintex
 * Data Tables and receive AI-powered responses using OpenAI's API.
 * 
 * Author: Connor Wells
 */

// Define the custom element for the OpenAI Chat Assistant
class OpenAIChatAssistant extends HTMLElement {
  // Define observed attributes for the custom element
  static get observedAttributes() {
    return [
      'label',
      'hint',
      'required',
      'readonly',
      'visible',
      'disabled',
      'apikey',
      'model',
      'tablereferences'
    ];
  }

  // Define metadata for the Nintex Form Plugin
  static get formPluginMetadata() {
    return {
      controlType: 'OpenAI Chat Assistant',
      dataSources: ['FormVariables', 'Controls'],
      group: 'Custom',
      icon: 'chat',
      title: 'OpenAI Chat Assistant',
      searchTerms: ['ai', 'chat', 'assistant', 'openai', 'gpt'],
      version: '1.0.0',
      properties: {
        label: {
          title: 'Label',
          description: 'Control label displayed to the user',
          type: 'string',
          default: 'OpenAI Chat Assistant'
        },
        hint: {
          title: 'Hint',
          description: 'Help text for the control',
          type: 'string',
          default: 'Ask questions about your form data'
        },
        apikey: {
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
          default: 'gpt-3.5-turbo'
        },
        tablereferences: {
          title: 'Data Tables',
          description: 'Select tables to make available to the assistant',
          type: 'array',
          items: {
            type: 'object',
            properties: {
              tableName: { type: 'string' },
              alias: { type: 'string' }
            }
          }
        }
      }
    };
  }

  constructor() {
    super();
    
    // Create a shadow DOM for the component
    this.attachShadow({ mode: 'open' });
    
    // Initialize properties
    this._label = 'OpenAI Chat Assistant';
    this._hint = 'Ask questions about your form data';
    this._required = false;
    this._readonly = false;
    this._visible = true;
    this._disabled = false;
    this._apikey = '';
    this._model = 'gpt-3.5-turbo';
    this._tablereferences = [];
    this._userPrompt = '';
    this._chatHistory = [];
    this._isLoading = false;
    
    // Create the initial UI
    this.render();
  }
  
  // Lifecycle callbacks
  connectedCallback() {
    // Add event listeners
    this.shadowRoot.querySelector('button').addEventListener('click', this.handleSendMessage.bind(this));
    this.shadowRoot.querySelector('input').addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        this.handleSendMessage();
      }
    });
    
    this.shadowRoot.querySelector('input').addEventListener('input', e => {
      this._userPrompt = e.target.value;
    });
  }
  
  disconnectedCallback() {
    // Remove event listeners
    this.shadowRoot.querySelector('button').removeEventListener('click', this.handleSendMessage.bind(this));
    this.shadowRoot.querySelector('input').removeEventListener('keydown', e => {
      if (e.key === 'Enter') {
        this.handleSendMessage();
      }
    });
    
    this.shadowRoot.querySelector('input').removeEventListener('input', e => {
      this._userPrompt = e.target.value;
    });
  }
  
  // Handle attribute changes
  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;
    
    switch (name) {
      case 'label':
        this._label = newValue;
        break;
      case 'hint':
        this._hint = newValue;
        break;
      case 'required':
        this._required = newValue !== null;
        break;
      case 'readonly':
        this._readonly = newValue !== null;
        break;
      case 'visible':
        this._visible = newValue !== null;
        break;
      case 'disabled':
        this._disabled = newValue !== null;
        break;
      case 'apikey':
        this._apikey = newValue;
        break;
      case 'model':
        this._model = newValue;
        break;
      case 'tablereferences':
        try {
          this._tablereferences = JSON.parse(newValue);
        } catch (e) {
          console.error('Error parsing tablereferences:', e);
          this._tablereferences = [];
        }
        break;
    }
    
    this.render();
  }
  
  // Getter/setter for properties
  get label() { return this._label; }
  set label(value) {
    this._label = value;
    this.setAttribute('label', value);
    this.render();
  }
  
  get hint() { return this._hint; }
  set hint(value) {
    this._hint = value;
    this.setAttribute('hint', value);
    this.render();
  }
  
  get required() { return this._required; }
  set required(value) {
    this._required = value;
    if (value) {
      this.setAttribute('required', '');
    } else {
      this.removeAttribute('required');
    }
    this.render();
  }
  
  get readonly() { return this._readonly; }
  set readonly(value) {
    this._readonly = value;
    if (value) {
      this.setAttribute('readonly', '');
    } else {
      this.removeAttribute('readonly');
    }
    this.render();
  }
  
  get visible() { return this._visible; }
  set visible(value) {
    this._visible = value;
    if (value) {
      this.setAttribute('visible', '');
    } else {
      this.removeAttribute('visible');
    }
    this.render();
  }
  
  get disabled() { return this._disabled; }
  set disabled(value) {
    this._disabled = value;
    if (value) {
      this.setAttribute('disabled', '');
    } else {
      this.removeAttribute('disabled');
    }
    this.render();
  }
  
  get apikey() { return this._apikey; }
  set apikey(value) {
    this._apikey = value;
    this.setAttribute('apikey', value);
  }
  
  get model() { return this._model; }
  set model(value) {
    this._model = value;
    this.setAttribute('model', value);
    this.render();
  }
  
  get tablereferences() { return this._tablereferences; }
  set tablereferences(value) {
    this._tablereferences = value;
    this.setAttribute('tablereferences', JSON.stringify(value));
    this.render();
  }
  
  // Handle sending messages
  async handleSendMessage() {
    if (!this._userPrompt.trim() || this._isLoading) {
      return;
    }

    const userMessage = this._userPrompt.trim();
    this._chatHistory.push({ role: 'user', content: userMessage });
    this._userPrompt = '';
    this._isLoading = true;
    this.render();

    // Get the form context
    const formContext = this.getRootNode().host?.formContext || window.formContext;
    
    // Create context with table data
    const contextResult = await this.createOpenAIContext(this._tablereferences, formContext);
    
    if (!contextResult.success) {
      this._chatHistory.push({ 
        role: 'assistant', 
        content: `Error accessing tables: ${contextResult.error}` 
      });
      this._isLoading = false;
      this.render();
      return;
    }
    
    // Send message to OpenAI with context
    const response = await this.executeTableQuery(
      this._apikey,
      this._model,
      userMessage,
      contextResult.context
    );

    if (!response.success) {
      this._chatHistory.push({ 
        role: 'assistant', 
        content: `Error: ${response.error}` 
      });
    } else {
      this._chatHistory.push({ 
        role: 'assistant', 
        content: response.response 
      });
    }

    this._isLoading = false;
    this.render();
  }
  
  // Render the component
  render() {
    const styles = `
      :host {
        display: block;
        font-family: sans-serif;
      }
      
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
    
    const chatMessages = this._chatHistory.map(message => `
      <div class="chat-message ${message.role === 'user' ? 'user-message' : 'assistant-message'}">
        ${message.content}
      </div>
    `).join('');
    
    const loadingMessage = this._isLoading ? `
      <div class="chat-message assistant-message">
        <div class="loading"></div> Thinking...
      </div>
    ` : '';
    
    const html = `
      <style>${styles}</style>
      <div class="container ${!this._visible ? 'hidden' : ''}">
        <label>${this._label}</label>
        
        <div class="chat-container">
          ${chatMessages}
          ${loadingMessage}
        </div>
        
        <div class="input-container">
          <input 
            type="text" 
            value="${this._userPrompt}"
            placeholder="Ask a question about your form data..."
            ?disabled="${this._disabled || this._readonly}"
          />
          <button 
            ?disabled="${this._disabled || this._readonly || this._isLoading}"
          >
            Send
          </button>
        </div>
        
        ${this._hint ? `<div class="hint">${this._hint}</div>` : ''}
      </div>
    `;
    
    this.shadowRoot.innerHTML = html;
    
    // Re-add event listeners after re-rendering
    if (this.shadowRoot.querySelector('button')) {
      this.shadowRoot.querySelector('button').addEventListener('click', this.handleSendMessage.bind(this));
    }
    
    if (this.shadowRoot.querySelector('input')) {
      this.shadowRoot.querySelector('input').addEventListener('keydown', e => {
        if (e.key === 'Enter') {
          this.handleSendMessage();
        }
      });
      
      this.shadowRoot.querySelector('input').addEventListener('input', e => {
        this._userPrompt = e.target.value;
      });
    }
  }

  /**
   * Fetches data from a Nintex Data Table using the REST API
   * @param {string} tableName - The name of the table to fetch data from
   * @param {Object} formContext - The Nintex form context object
   * @returns {Promise<Object>} - The table data or error
   */
  async fetchTableData(tableName, formContext) {
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
  async getAvailableTables(formContext) {
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
  async createOpenAIContext(tableReferences, formContext) {
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
  }

  /**
   * Executes a query against table data using OpenAI
   * @param {string} apiKey - OpenAI API key
   * @param {string} model - OpenAI model to use
   * @param {string} userQuery - The user's natural language query
   * @param {Object} context - The context object with table data
   * @returns {Promise<Object>} - The query result
   */
  async executeTableQuery(apiKey, model, userQuery, context) {
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
}

// Define the custom element
customElements.define('openai-chat-assistant', OpenAIChatAssistant);
