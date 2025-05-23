
// Extract certificate data from the DOM
export function extractCertificateData(doc: Document, certNumber: string): any {
  try {
    // Card name is usually in a heading element
    let cardName = "";
    const cardNameElement = doc.querySelector(".cert-details h1, .cert-details h2, .cert-item-details h1");
    if (cardNameElement) {
      cardName = cardNameElement.textContent.trim();
    }

    // Grade is typically displayed prominently
    let grade = "";
    const gradeElement = doc.querySelector(".cert-grade, .grade-value");
    if (gradeElement) {
      grade = gradeElement.textContent.trim().replace("GRADE:", "").trim();
    }

    // Set information
    let set = "";
    const setElement = doc.querySelector(".cert-set, .set-name");
    if (setElement) {
      set = setElement.textContent.trim();
    }

    // Year information
    let year = "";
    const yearElement = doc.querySelector(".cert-year, .year-value");
    if (yearElement) {
      year = yearElement.textContent.trim();
    }

    // Card number information
    let cardNumber = "";
    const cardNumberElement = doc.querySelector(".cert-number, .card-number");
    if (cardNumberElement) {
      cardNumber = cardNumberElement.textContent.trim().replace("#", "").trim();
    }

    // Get image if available
    let imageUrl = null;
    const imageElement = doc.querySelector(".cert-image img, .card-image img");
    if (imageElement) {
      imageUrl = imageElement.getAttribute("src");
      if (imageUrl && !imageUrl.startsWith("http")) {
        imageUrl = `https://www.psacard.com${imageUrl}`;
      }
    }

    // Determine game type based on the certificate details
    let game = determineGameType(cardName, set);

    // Format certification date
    const certDate = doc.querySelector(".cert-date");
    let certificationDate = null;
    if (certDate) {
      certificationDate = certDate.textContent.trim();
      // Try to format to ISO string if possible
      try {
        const dateObj = new Date(certificationDate);
        if (!isNaN(dateObj.getTime())) {
          certificationDate = dateObj.toISOString();
        }
      } catch (e) {
        console.log("Failed to parse date:", e);
      }
    }

    // Construct the certificate data in the format expected by our frontend
    return {
      certNumber: certNumber,
      cardName: cardName || "Unknown Card",
      grade: grade || "Unknown",
      year: year || "",
      set: set || "",
      cardNumber: cardNumber || "",
      playerName: determinePlayerName(cardName),
      imageUrl,
      certificationDate,
      game
    };
  } catch (error) {
    console.error("Error extracting cert data:", error);
    // Return minimal data if extraction fails
    return {
      certNumber,
      cardName: "Certificate Data Extraction Failed",
      grade: "Unknown",
      game: "other"
    };
  }
}

// Helper function to determine game type from card details
export function determineGameType(cardName: string, set: string): string {
  const lowerCardName = (cardName || "").toLowerCase();
  const lowerSet = (set || "").toLowerCase();
  
  // Check for Pokemon
  if (lowerCardName.includes("pokemon") || 
      lowerSet.includes("pokemon") || 
      lowerCardName.includes("pikachu") ||
      lowerCardName.includes("charizard")) {
    return "pokemon";
  }
  
  // Check for Magic: The Gathering
  if (lowerCardName.includes("magic") || 
      lowerSet.includes("magic") ||
      lowerSet.includes("mtg") ||
      lowerCardName.includes("gathering")) {
    return "magic";
  }
  
  // Check for Yu-Gi-Oh
  if (lowerCardName.includes("yugioh") || 
      lowerCardName.includes("yu-gi-oh") || 
      lowerSet.includes("yugioh") ||
      lowerSet.includes("yu-gi-oh")) {
    return "yugioh";
  }
  
  // Check for sports cards
  if (lowerCardName.includes("topps") || 
      lowerCardName.includes("upper deck") ||
      lowerCardName.includes("fleer") ||
      lowerCardName.includes("panini") ||
      lowerCardName.includes("bowman") ||
      lowerSet.includes("baseball") ||
      lowerSet.includes("football") ||
      lowerSet.includes("basketball") ||
      lowerSet.includes("hockey")) {
    return "sports";
  }
  
  // Default
  return "other";
}

// Extract player name from card name for sports cards
export function determinePlayerName(cardName: string): string {
  // This is a simplistic approach, would need refinement for production
  if (!cardName) return "";
  
  // For sports cards, often the first part is the player name
  const parts = cardName.split(' ');
  if (parts.length >= 2) {
    // Very basic heuristic - take first two parts as name
    // A more sophisticated approach would be needed for production
    return `${parts[0]} ${parts[1]}`;
  }
  
  return "";
}
