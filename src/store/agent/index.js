import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { GoogleGenerativeAI } from "@google/generative-ai";

const client = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_KEY);

const prompt = (userInput, code, error) => ({
    parts: `You are a helpful AI assistant. Your task is to solve errors in the user's code using the following information: User Input: ${userInput}, Code: ${code}, Error: ${error}.`,
    role: "user",
});

// Chat message structure
const createMessage = (role, content, timestamp = Date.now()) => ({
    id: timestamp,
    role, // 'user' or 'assistant'
    content,
    timestamp
});

// Async thunk for generating response
export const generateResponse = createAsyncThunk(
    'agent/generateResponse',
    async (_, { getState, rejectWithValue }) => {
        try {
            const state = getState();
            const { userInput, code, error } = state.agent;
            
            // Generate prompt
            const promptData = prompt(userInput, code, error);
            
            // Get model and generate content
            const model = client.getGenerativeModel({ 
                model: "gemini-2.0-flash",
                temperature: 0.7,
            });
            
            const result = await model.generateContent(promptData);
            const responseText = result.response.text();
            
            return {
                userMessage: `Help me with this code error:\nCode: ${code}\nError: ${error}\n${userInput}`,
                assistantMessage: responseText
            };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

const initialState = {
    agent: {
        userInput: "",
        code: "",
        error: null,
        chat: [], // Array of chat messages
        isLoading: false,
        lastError: null,
    }
};

export const agentSlice = createSlice({
    name: "agent",
    initialState,
    reducers: {
        setUserInput: (state, action) => {
            state.agent.userInput = action.payload;
        },
        setCode: (state, action) => {
            state.agent.code = action.payload;
        },
        setError: (state, action) => {
            state.agent.error = action.payload;
        },
        addUserMessage: (state, action) => {
            const message = createMessage('user', action.payload);
            state.agent.chat.push(message);
        },
        addAssistantMessage: (state, action) => {
            const message = createMessage('assistant', action.payload);
            state.agent.chat.push(message);
        },
        clearChat: (state) => {
            state.agent.chat = [];
        },
        clearError: (state) => {
            state.agent.lastError = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(generateResponse.pending, (state) => {
                state.agent.isLoading = true;
                state.agent.lastError = null;
            })
            .addCase(generateResponse.fulfilled, (state, action) => {
                state.agent.isLoading = false;
                
                // Add user message to chat
                const userMessage = createMessage('user', action.payload.userMessage);
                state.agent.chat.push(userMessage);
                
                // Add assistant response to chat
                const assistantMessage = createMessage('assistant', action.payload.assistantMessage);
                state.agent.chat.push(assistantMessage);
            })
            .addCase(generateResponse.rejected, (state, action) => {
                state.agent.isLoading = false;
                state.agent.lastError = action.payload;
            });
    },
});

export const {
    setUserInput,
    setCode,
    setError,
    addUserMessage,
    addAssistantMessage,
    clearChat,
    clearError
} = agentSlice.actions;
export default agentSlice.reducer;
