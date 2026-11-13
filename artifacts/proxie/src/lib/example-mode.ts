import { createContext, useContext } from "react";

export const ExampleContext = createContext(false);
export const useExampleWorkspace = () => useContext(ExampleContext);
