document.addEventListener('DOMContentLoaded', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const url = tabs[0].url;
  
      // Check if the current URL is a Discogs seller page
      if (!url.includes('discogs.com/seller')) {
        disableFilters();
      }
    });
  
    const disableFilters = () => {
      document.getElementById('condition').disabled = true;
      document.getElementById('max-price').disabled = true;
      document.getElementById('min-rating').disabled = true;
      document.getElementById('min-want-have-ratio').disabled = true;
      document.getElementById('apply-filters').disabled = true;
      document.getElementById('apply-filters').style.backgroundColor = '#ccc';  // Update button style to show it's disabled
    };
  });
  

// Send the filtering criteria to the content script
document.getElementById('apply-filters').addEventListener('click', () => {
  const condition = document.getElementById('condition').value;
  const maxPrice = parseFloat(document.getElementById('max-price').value);
  const minRating = parseFloat(document.getElementById('min-rating').value);
  const minWantHaveRatio = parseFloat(document.getElementById('min-want-have-ratio').value);

  console.log("Sending filters: ", { condition, maxPrice, minRating, minWantHaveRatio });

  // Send the message to the content script with filter values
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {
          action: 'applyFilters',
          conditionFilter: condition,
          priceFilter: maxPrice,
          ratingFilter: minRating,
          wantHaveFilter: minWantHaveRatio
      });
  });
});

// Request the current filters when the popup opens
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  chrome.tabs.sendMessage(tabs[0].id, { action: 'getFilters' }, (response) => {
      if (response) {
          // Update the popup fields with the current filter values from contentScript.js
          document.getElementById('condition').value = response.conditionFilter || 'Very Good Plus (VG+)';
          document.getElementById('max-price').value = response.priceFilter || 50;
          document.getElementById('min-rating').value = response.ratingFilter || 4.5;
          document.getElementById('min-want-have-ratio').value = response.wantHaveFilter || 1;
      }
  });
});

