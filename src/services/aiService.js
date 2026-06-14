// This service now only acts as a thin client to call our secure backend API.
// The actual AI extraction and Google Drive fetching happen on the Vercel server.

export const extractSSCPercentage = async (driveUrl) => {
  try {
    // 1. Extract the file ID
    let id = driveUrl;
    if (driveUrl.includes('id=')) {
      id = driveUrl.split('id=')[1].split('&')[0];
    } else if (driveUrl.includes('/d/')) {
      id = driveUrl.split('/d/')[1].split('/')[0];
    }

    if (!id) {
      throw new Error("Invalid Google Drive URL");
    }

    // 2. Call the secure Vercel backend
    const response = await fetch('/api/extract-marksheet', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Backend returned status ${response.status}`);
    }

    const data = await response.json();
    return data.percentage;

  } catch (error) {
    console.error("AI Extraction Error:", error);
    throw error;
  }
};
