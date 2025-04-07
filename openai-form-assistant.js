/**
 * OpenAI Chat Assistant Plugin for Nintex Forms
 * A simple, standalone implementation without external dependencies
 */

class OpenAIChatAssistant extends HTMLElement {
  // Define static properties for Nintex Form Plugin
  static get formPluginMetadata() {
    return {
      controlName: 'OpenAI Chat Assistant',
      fallbackDisableSubmit: false,
      groupName: 'Custom',
      iconUrl: '',
      version: '1.0',
      properties: {
        label: {
          title: 'Label',
          type: 'string',
          defaultValue: 'OpenAI Chat Assistant'
        },
        hint: {
          title: 'Hint',
          type: 'string',
          defaultValue: 'Ask questions about your form data'
        },
        apiKey: {
          title: 'OpenAI API Key',
          type: 'string',
          isSecureString: true
        },
        model: {
          title: 'OpenAI Model',
          type: 'string',
          enum: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4o'],
          defaultValue: 'gpt-3.5-turbo'
        },
        tableReferences: {
          title: 'Data Tables (JSON Array)',
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
  }

  constructor() {
    super();
    
    // Create shadow DOM
    this.attachShadow({ mode: 'open' });
    
    // Initialize properties
    this._label = 'OpenAI Chat Assistant';
    this._hint = 'Ask questions about your form data';
    this._apiKey = '';
    this._model = 'gpt-3.5-turbo';
    this._tableReferences = '[]';
    this._userPrompt = '';
    this._chatHistory = [];
    this._isLoading = false;
    
    // Initial render
    this.render();
  }
  
  // Define observed attributes
  static get observedAttributes() {
    return ['label', 'hint', 'apikey', 'model', 'tablereferences', 'readonly', 'disabled', 'required', 'visible'];
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
      case 'apikey':
        this._apiKey = newValue;
        break;
      case 'model':
        this._model = newValue;
        break;
      case 'tablereferences':
        this._tableReferences = newValue;
        break;
      case 'readonly':
        this._readonly = newValue !== null;
        break;
      case 'disabled':
        this._disabled = newValue !== null;
        break;
      case 'required':
        this._required = newValue !== null;
        break;
      case 'visible':
        this._visible = newValue !== null;
        break;
    }
    
    this.render();
  }
  
  // Handle send message button click
  async handleSendMessage() {
    if (!this._userPrompt.trim() || this._isLoading) {
      return;
    }

    const userMessage = this._userPrompt.trim();
    this._chatHistory.push({ role: 'user', content: userMessage });
    this._userPrompt = '';
    this._isLoading = true;
    this.render();

    try {
      // Simulate a response for now (in a real implementation, we'd call OpenAI)
      setTimeout(() => {
        this._chatHistory.push({ 
          role: 'assistant', 
          content: `This is a simulated response to your query: "${userMessage}". In a real implementation, this would call the OpenAI API and access your Nintex Data Tables.` 
        });
        this._isLoading = false;
        this.render();
      }, 1000);
    } catch (error) {
      this._chatHistory.push({ 
        role: 'assistant', 
        content: `Error: ${error.message}` 
      });
      this._isLoading = false;
      this.render();
    }
  }
  
  // Render the component
  render() {
    // Add styles
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
    
    // Build chat message HTML
    const chatMessages = this._chatHistory.map(message => `
      <div class="chat-message ${message.role === 'user' ? 'user-message' : 'assistant-message'}">
        ${message.content}
      </div>
    `).join('');
    
    // Add loading message if needed
    const loadingMessage = this._isLoading ? `
      <div class="chat-message assistant-message">
        <div class="loading"></div> Thinking...
      </div>
    ` : '';
    
    // Create HTML content
    const html = `
      <style>${styles}</style>
      <div class="container ${this._visible === false ? 'hidden' : ''}">
        <label>${this._label}</label>
        
        <div class="chat-container">
          ${chatMessages}
          ${loadingMessage}
        </div>
        
        <div class="input-container">
          <input 
            type="text" 
            id="prompt-input"
            placeholder="Ask a question about your form data..."
            ?disabled="${this._disabled || this._readonly}"
          />
          <button 
            id="send-button"
            ?disabled="${this._disabled || this._readonly || this._isLoading}"
          >
            Send
          </button>
        </div>
        
        ${this._hint ? `<div class="hint">${this._hint}</div>` : ''}
      </div>
    `;
    
    // Update the shadow DOM
    this.shadowRoot.innerHTML = html;
    
    // Add event listeners
    const inputElement = this.shadowRoot.querySelector('#prompt-input');
    const buttonElement = this.shadowRoot.querySelector('#send-button');
    
    if (inputElement) {
      inputElement.value = this._userPrompt;
      inputElement.addEventListener('input', e => {
        this._userPrompt = e.target.value;
      });
      
      inputElement.addEventListener('keydown', e => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.handleSendMessage();
        }
      });
    }
    
    if (buttonElement) {
      buttonElement.addEventListener('click', () => {
        this.handleSendMessage();
      });
    }
  }
}

// Register the custom element
customElements.define('openai-chat-assistant', OpenAIChatAssistant);
