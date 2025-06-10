import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  compiler: {
    code: "",
    output: "",
    languages:['javascript', 'python', 'java', 'c', 'c++' ],
    currentLanguage: 'javascript',
    error: null,
    isRunning: false,
  },
};

const compilerSlice = createSlice({
  name: "compiler",
  initialState,
  reducers: {
    setCode: (state, action) => {
      state.compiler.code = action.payload;
    },
    setLanguage: (state, action) => {
      state.compiler.currentLanguage = action.payload;
    },
    setOutput: (state, action) => {
      state.compiler.output = action.payload;
    },
    setError: (state, action) => {
      state.compiler.error = action.payload;
    },
    setIsRunning: (state, action) => {
      state.compiler.isRunning = action.payload;
    },
  },
});

export const { setCode, setOutput, setError,setLanguage , setIsRunning } = compilerSlice.actions;

export default compilerSlice.reducer;
