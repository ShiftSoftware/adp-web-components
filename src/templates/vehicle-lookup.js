const vehicleSpecification = document.getElementById('vehicle-specification');
const vehicleAccessories = document.getElementById('vehicle-accessories');
const warranty = document.getElementById('warranty');
const serviceHistory = document.getElementById('service-history');
const paintThickness = document.getElementById('paint-thickness');
const dynamicClaim = document.getElementById('dynamic-claim');

const componentsList = [vehicleSpecification, warranty, serviceHistory, dynamicClaim, paintThickness, vehicleAccessories];

const input = document.getElementById('vinInput');
const error = document.getElementsByClassName('error-message')[0];
const searchIcon = document.getElementById('search-icon');
const spinnerIcon = document.getElementById('spinner-icon');
const searchText = document.getElementById('search-text');
const searchButton = document.getElementById('search-button');

const franchiseSelector = document.getElementById('franchise-selector');
const franchiseSelectorError = document.getElementById('franchise-selector-error-message');

var lastLookupResult = null;

function handleLoadingState(isLoading) {
  if (isLoading) {
    $("li:not('.active')").addClass('disabled');

    searchIcon.style.display = 'none';
    spinnerIcon.style.display = 'inline-block';
    searchText.innerHTML = 'Searching...';
    input.readOnly = true;
    input.classList.add('disabled');
  } else {
    $("li:not('.active')").removeClass('disabled');
    searchIcon.style.display = 'inline-block';
    spinnerIcon.style.display = 'none';
    searchText.innerHTML = 'Search';
    input.readOnly = false;
    input.classList.remove('disabled');
    searching = false;
  }
}

function handleLoadData(newResponse, activeElement) {
  componentsList.forEach(element => {
    if (element !== null && element !== activeElement && newResponse) element.setData(newResponse);
  });
}

document.onreadystatechange = function (e) {
  $('#vehicle-info-tab a').click(function (e) {
    e.preventDefault();
    $(this).tab('show');
  });

  $('#search-button').click(function () {
    search();
  });

  componentsList.forEach(element => {
    if (element === null) return;

    element.loadingStateChange = handleLoadingState;
    element.loadedResponse = newResponse => handleLoadData(newResponse, element);
  });

  $(input).keydown(function (e) {
    if (e.keyCode == 13) {
      e.preventDefault();
      search();
    }
  });
};

var searching = false;
function search() {
  if (searching) return;

  searching = true;

  input.classList.remove('error_bg');
  error.innerHTML = '';

  if (franchiseSelector) {
    franchiseSelector.classList.remove('error_bg');

    franchiseSelectorError.innerHTML = '';
  }

  var vin = input.value;

  if (vin == '') {
    input.classList.add('error_bg');

    error.innerHTML = 'VIN is required';

    searching = false;

    return;
  }

  if (!validateVin(vin)) {
    input.classList.add('error_bg');

    error.innerHTML = 'Invalid VIN';

    searching = false;

    return;
  }

  if (franchiseSelector) {
    var franchise = franchiseSelector.value;

    warranty.setAttribute('brand-integration-id', franchise);

    if (franchise == '') {
      franchiseSelector.classList.add('error_bg');

      franchiseSelectorError.innerHTML = 'Please Select';

      searching = false;

      return;
    }
  }

  if ($(vehicleSpecification).is(':visible')) {
    vehicleSpecification.fetchData(vin);
  }
  if ($(warranty).is(':visible')) {
    warranty.fetchData(vin);
  }
  if ($(serviceHistory).is(':visible')) {
    serviceHistory.fetchData(vin);
  }
  if ($(dynamicClaim).is(':visible')) {
    dynamicClaim.fetchData(vin);
  }
  if ($(paintThickness).is(':visible')) {
    paintThickness.fetchData(vin);
  }
  if ($(vehicleAccessories).is(':visible')) {
    vehicleAccessories.fetchData(vin);
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
