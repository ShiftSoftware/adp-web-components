let vehicleSpecification;
let vehicleAccessories;
let warranty;
let serviceHistory;
let paintThickness;
let dynamicClaim;
let distributorLookup;
let deadStockLookup;
let manufacturerLookup;
let componentsList;
let searchutton;
let partNumberInput;
let partQtyInput;
let vinInput;
let franchiseSelector;
let searching;
let lookupPage;

function handleLoadingState(isLoading) {
  lookupPage.invokeMethodAsync('onLoadingStateChanged', isLoading);

  if (!isLoading) searching = false;
}

function handleLoadData(newResponse, activeElement) {
  componentsList.forEach(element => {
    if (element !== null && element !== activeElement && newResponse) element.setData(newResponse);
  });
}

function registerLookupPage(instance) {
  lookupPage = instance;

  vehicleSpecification = document.getElementById('vehicle-specification');
  vehicleAccessories = document.getElementById('vehicle-accessories');
  warranty = document.getElementById('warranty');
  serviceHistory = document.getElementById('service-history');
  paintThickness = document.getElementById('paint-thickness');
  dynamicClaim = document.getElementById('dynamic-claim');
  distributorLookup = document.getElementById('distributor-lookup');
  deadStockLookup = document.getElementById('dead-stock-lookup');
  manufacturerLookup = document.getElementById('manufacturer-lookup');
  componentsList = [vehicleSpecification, warranty, serviceHistory, dynamicClaim, paintThickness, vehicleAccessories, distributorLookup, deadStockLookup, manufacturerLookup];
  searchutton = document.getElementById('searchButton');
  partNumberInput = document.getElementById('partNumberInput');
  partQtyInput = document.getElementById('partQtyInput');
  vinInput = document.getElementById('vinInput');
  franchiseSelector = document.getElementById('franchise-selector');

  if (lookupPage.invokeMethodAsync) {
  } else {
    lookupPage.invokeMethodAsync = async function (methodName, payload) {
      if (methodName === 'onErrorStateChanged') {
        await lookupPage.onErrorStateChanged(payload);
      } else if (methodName === 'onLoadingStateChanged') {
        await lookupPage.onLoadingStateChanged(payload);
      } else if (methodName === 'getHeaders') {
        return await lookupPage.getHeaders();
      }
    };
  }

  componentsList.forEach(element => {
    if (element === null) return;

    element.loadingStateChange = handleLoadingState;
    element.loadedResponse = newResponse => handleLoadData(newResponse, element);
  });

  if (searchutton) {
    searchutton.addEventListener('click', async function (e) {
      await search();
    });
  }

  if (vinInput) {
    vinInput.addEventListener('keydown', async function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        await search();
      }
    });
  }

  if (partNumberInput) {
    partNumberInput.addEventListener('keydown', async function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        await search();
      }
    });
  }

  if (partQtyInput) {
    partQtyInput.addEventListener('keydown', async function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        await search();
      }
    });
  }
}

async function search() {
  if (searching) return;

  searching = true;

  lookupPage.invokeMethodAsync('onErrorStateChanged', { vinError: null, franchiseError: null, partError: null });

  if (vinInput) {
    var vin = vinInput.value;

    if (vin == '') {
      lookupPage.invokeMethodAsync('onErrorStateChanged', { vinError: 'VIN is required', franchiseError: null, partError: null });

      searching = false;

      return;
    }

    if (!validateVin(vin)) {
      lookupPage.invokeMethodAsync('onErrorStateChanged', { vinError: 'Invalid VIN', franchiseError: null, partError: null });

      searching = false;

      return;
    }

    if (franchiseSelector) {
      var franchise = franchiseSelector.value;

      warranty.setAttribute('brand-integration-id', franchise);

      if (franchise == '') {
        lookupPage.invokeMethodAsync('onErrorStateChanged', { vinError: null, franchiseError: 'Please Select a Franchise', partError: null });

        searching = false;

        return;
      }
    }

    var headers = await lookupPage.invokeMethodAsync('getHeaders');

    if (vehicleSpecification && vehicleSpecification.checkVisibility()) {
      vehicleSpecification.fetchData(vin, headers);
    }
    if (warranty && warranty.checkVisibility()) {
      warranty.fetchData(vin, headers);
    }
    if (serviceHistory && serviceHistory.checkVisibility()) {
      serviceHistory.fetchData(vin, headers);
    }
    if (dynamicClaim && dynamicClaim.checkVisibility()) {
      dynamicClaim.fetchData(vin, headers);
    }
    if (paintThickness && paintThickness.checkVisibility()) {
      paintThickness.fetchData(vin, headers);
    }
    if (vehicleAccessories && vehicleAccessories.checkVisibility()) {
      vehicleAccessories.fetchData(vin, headers);
    }
  }

  if (partNumberInput) {
    var partNumber = partNumberInput.value;

    if (partNumber == '') {
      lookupPage.invokeMethodAsync('onErrorStateChanged', { partError: 'Part Number is Required' });

      searching = false;

      return;
    }

    var searchText = partNumber;

    var partQty = partQtyInput.value;

    if (partQty.trim() !== '' && partQty !== '0') {
      searchText = `${partNumber}/${partQty}`;
    }

    var headers = await lookupPage.invokeMethodAsync('getHeaders');

    if (distributorLookup && distributorLookup.checkVisibility()) {
      distributorLookup.fetchData(searchText, headers);
    }
    if (deadStockLookup && deadStockLookup.checkVisibility()) {
      deadStockLookup.fetchData(searchText, headers);
    }
    if (manufacturerLookup && manufacturerLookup.checkVisibility()) {
      manufacturerLookup.fetchData(searchText, headers);
    }
  }
}

function validateVin(vin) {
  var TransliterationTable = {
    0: 0,
    1: 1,
    2: 2,
    3: 3,
    4: 4,
    5: 5,
    6: 6,
    7: 7,
    8: 8,
    9: 9,

    A: 1,
    B: 2,
    C: 3,
    D: 4,
    E: 5,
    F: 6,
    G: 7,
    H: 8,

    J: 1,
    K: 2,
    L: 3,
    M: 4,
    N: 5,
    P: 7,
    R: 9,

    S: 2,
    T: 3,
    U: 4,
    V: 5,
    W: 6,
    X: 7,
    Y: 8,
    Z: 9,
  };

  var WeightTable = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];

  var sum = 0;

  var valid = true;

  for (var i = 0; i < vin.length; i++) {
    var char = vin[i].toUpperCase();

    var value = TransliterationTable[char];

    if (value === undefined) {
      valid = false;
      break;
    }

    var weight = WeightTable[i];

    var product = value * weight;

    sum = sum + product;
  }

  var reminder = (sum % 11).toString();

  if (reminder === '10') reminder = 'X';

  if (vin[8] != reminder) {
    valid = false;
  }

  return valid;
}

export { registerLookupPage };
