import mondaySdk from "monday-sdk-js";

// Initialize the Monday SDK
const monday = mondaySdk();

// Store context information
const contextData: {
  boardId?: string;
  isOnItem: boolean;
} = {
  isOnItem: false,
};

// Initialize the SDK and get context
export const initMondayClient = async () => {
  monday.setToken("2aa1fd95f2878d57ffcb5e8a905640c4");

  try {
    // Get the context from Monday
    const context = await monday.get("context");

    if (context.data) {
      // Check if we're on an item
      contextData.isOnItem = !!context.data.itemId;

      // Store the board ID if available
      if (context.data.boardId) {
        contextData.boardId = context.data.boardId;
      }
    }
  } catch (error) {
    console.error("Error getting Monday context:", error);
  }

  return monday;
};

// Get the storage key based on context
export const getStorageKey = () => {
  if (contextData.isOnItem && contextData.boardId) {
    return `DOCSY_BOARD_${contextData.boardId}`;
  }
  return "DOCSY_OBJECT";
};

// Export the initialized instance
export const getMondayClient = () => monday;

// Export context data
export const getContextData = () => contextData;

export default monday;
