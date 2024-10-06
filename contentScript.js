console.log("Content script loaded and running");

// Define a condition hierarchy for comparing condition grades
const conditionHierarchy = ['Poor', 'Fair', 'Good', 'Good Plus (G+)', 'Very Good (VG)', 'Very Good Plus (VG+)', 'Near Mint (NM or M-)', 'Mint (M)'];

// Global variables to store the filters
let currentConditionFilter = 'Very Good Plus (VG+)';  // Default condition filter
let currentPriceFilter = 50;  // Default price filter
let currentRatingFilter = 4.5;  // Default rating filter
let currentWantHaveFilter = 1;  // Default Want/Have ratio filter

// Function to filter the listings based on condition, price, rating, and Want/Have ratio
function filterListings(conditionFilter, priceFilter, ratingFilter, wantHaveFilter) {
  console.log("Filtering listings with: ", { conditionFilter, priceFilter, ratingFilter, wantHaveFilter });

  const listings = document.querySelectorAll('tr.shortcut_navigable');  // Get all listing rows
  if (!listings.length) {
    console.log("No listings found to filter.");
    return; // Exit if there are no listings to filter
  }

  listings.forEach((listing) => {
    const priceElement = listing.querySelector('td.item_price span.price');  // Find price element
    const priceText = priceElement.getAttribute('data-pricevalue');  // Get the price text
    const price = parseFloat(priceText);  // Convert price to a number

    // Find the condition element (3rd span) and extract text content
    const conditionElement = listing.querySelector('p.item_condition span:nth-of-type(3)');
    const conditionText = conditionElement ? conditionElement.childNodes[0].textContent.trim() : "Unknown Condition";

    // Extract the rating (assuming it's available in a .rating class)
    const ratingElement = listing.querySelector('.community_rating strong');
    const ratingText = ratingElement ? parseFloat(ratingElement.textContent.trim()) : 0;

    const haveElement = listing.querySelector('.have_indicator .community_number');
    const wantElement = listing.querySelector('.want_indicator .community_number');

    const haveText = haveElement ? haveElement.textContent.trim() : "1"; // Default to 1 to avoid division by zero
    const wantText = wantElement ? wantElement.textContent.trim() : "0"; // Default to 0 if no want value

    const have = parseFloat(haveText); // Convert to a float value
    const want = parseFloat(wantText); // Convert to a float value

    const wantHaveRatio = want / have; // Calculate the Want/Have ratio

    console.log("Listing condition:", conditionText, "Listing price:", price, "Rating:", ratingText, "Want/Have Ratio:", wantHaveRatio);

    // Apply filter: Only hide rows that don't match criteria
    let shouldHide = false;  // By default, we will not hide the listing

    // Check if the condition filter is set and compare conditions based on the hierarchy
    if (conditionFilter) {
      const selectedConditionIndex = conditionHierarchy.indexOf(conditionFilter);
      const listingConditionIndex = conditionHierarchy.indexOf(conditionText);

      // Hide if the listing's condition is lower than the selected condition
      if (listingConditionIndex < selectedConditionIndex) {
        shouldHide = true;
      }
    }

    // Check the price filter
    if (priceFilter && price > priceFilter) {
      shouldHide = true;  // Hide if price exceeds the max price
    }

    // Check the rating filter
    if (ratingFilter && ratingText < ratingFilter) {
      shouldHide = true;  // Hide if rating is below the threshold
    }

    // Check the Want/Have ratio filter
    if (wantHaveFilter && wantHaveRatio < wantHaveFilter) {
      shouldHide = true;  // Hide if Want/Have ratio is below the threshold
    }

    if (shouldHide) {
      listing.style.display = 'none';  // Hide the row if it doesn't match the filter criteria
    } else {
      listing.style.display = '';  // Show the row if it matches the filter criteria
    }
  });

  // Trigger a small scroll to load lazy-loaded images
  triggerScroll();

  // Force lazy-loaded images to load
  loadAlbumArt();
}

// Function to trigger a small scroll and force lazy-loaded images to load
function triggerScroll() {
  window.scrollBy(0, 1); // Scroll down by 1 pixel
  window.scrollBy(0, -1); // Scroll back up by 1 pixel
}

// Function to force lazy-loaded images to load
function loadAlbumArt() {
  const images = document.querySelectorAll('img.lazyload, img[data-src]');
  images.forEach((img) => {
    const dataSrc = img.getAttribute('data-src');
    if (dataSrc) {
      img.setAttribute('src', dataSrc); // Set the actual image source
    }
  });
}

// Function to wait until the page is fully loaded before applying filters
function waitForListingsToLoad(callback) {
  const checkListings = setInterval(() => {
    const listings = document.querySelectorAll('tr.shortcut_navigable');
    if (listings.length > 0) {
      console.log("Listings loaded, applying filters...");
      clearInterval(checkListings);  // Stop checking once listings are loaded
      callback();  // Call the function to filter listings
    } else {
      console.log("Listings not found, retrying...");
    }
  }, 500);  // Check every 500ms
}

// Function to observe changes in the page and reapply filtering
function observeListings() {
  const listingsContainer = document.querySelector('tbody');

  if (!listingsContainer) {
    console.log("Listings container not found, retrying...");
    setTimeout(observeListings, 1000);  // Retry after 1000ms if the container isn't available
    return;
  }

  const observer = new MutationObserver(() => {
    console.log("Listings updated, reapplying filters");
    waitForListingsToLoad(() => filterListings(currentConditionFilter, currentPriceFilter, currentRatingFilter, currentWantHaveFilter));
  });

  // Observe both `childList` and `attributes` to ensure any relevant changes are captured
  observer.observe(listingsContainer, {
    childList: true,  // Watch for changes to child elements (listings)
    subtree: true,    // Watch the entire subtree of the listings container
    attributes: true  // Watch for attribute changes to listings (such as display changes)
  });
}

// Function to initialize the filter and observer
function initFilter(conditionFilter, priceFilter, ratingFilter, wantHaveFilter, delay = 500) {
  console.log("Initializing filters with:", { conditionFilter, priceFilter, ratingFilter, wantHaveFilter });  // Log for debugging

  // Update global filter variables; if no filter is provided, use the default values
  currentConditionFilter = conditionFilter || currentConditionFilter;
  currentPriceFilter = priceFilter || currentPriceFilter;
  currentRatingFilter = ratingFilter || currentRatingFilter;
  currentWantHaveFilter = wantHaveFilter || currentWantHaveFilter;

  // Apply a delay before applying the filters
  setTimeout(() => {
    waitForListingsToLoad(() => {
      filterListings(currentConditionFilter, currentPriceFilter, currentRatingFilter, currentWantHaveFilter);  // Apply filters when the listings are ready
      observeListings();  // Set up observer to reapply filters on page changes
    });
  }, delay);
}

// Monitor URL changes to detect page navigation
let currentUrl = window.location.href;

function monitorPageNavigation() {
  // Listen to `popstate` event to detect navigation (back/forward, page change)
  window.addEventListener('popstate', () => {
    if (window.location.href !== currentUrl) {
      currentUrl = window.location.href;
      console.log("Page navigation detected, reapplying filters...");
      initFilter(currentConditionFilter, currentPriceFilter, currentRatingFilter, currentWantHaveFilter, 2000);  // Increased delay to 2000ms
    }
  });

  // Also set an interval to catch cases where URL changes aren't triggered by `popstate`
  setInterval(() => {
    if (window.location.href !== currentUrl) {
      currentUrl = window.location.href;
      console.log("URL change detected, reapplying filters...");
      initFilter(currentConditionFilter, currentPriceFilter, currentRatingFilter, currentWantHaveFilter, 2000);  // Increased delay to 2000ms
    }
  }, 1000);  // Check every second
}

// Listen for messages from popup.js to retrieve the current filter values
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'applyFilters') {  // Apply filters from popup
    const { conditionFilter, priceFilter, ratingFilter, wantHaveFilter } = message;
    console.log("Received filters from popup:", { conditionFilter, priceFilter, ratingFilter, wantHaveFilter });
    initFilter(conditionFilter, priceFilter, ratingFilter, wantHaveFilter);  // Apply the new filters dynamically
    sendResponse({ status: 'Filters applied' });
  }

  if (message.action === 'getFilters') {  // Return current filters to popup
    console.log("Popup requesting current filters.");
    sendResponse({
      conditionFilter: currentConditionFilter,
      priceFilter: currentPriceFilter,
      ratingFilter: currentRatingFilter,
      wantHaveFilter: currentWantHaveFilter
    });
  }
});

// Run the filters when the page first loads (default to set global variables)
window.addEventListener('load', () => {
  console.log("Page load detected, applying filters...");
  initFilter(currentConditionFilter, currentPriceFilter, currentRatingFilter, currentWantHaveFilter, 1000);  // Add a delay for initial page load filtering
  monitorPageNavigation();  // Start monitoring for URL changes
});
