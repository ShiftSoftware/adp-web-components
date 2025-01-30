const mockData = {
  'SU00302474': {
    "partNumber": "SU00302474",
    "partDescription": "CLAMP",
    "localDescription": "Неприменимо",
    "group": "F",
    "pnc": "",
    "pncLocalName": "",
    "binCode": null,
    "dimension1": 80,
    "dimension2": 50,
    "dimension3": 15,
    "netWeight": 250,
    "grossWeight": null,
    "cubicMeasure": 600,
    "hsCode": null,
    "uzhsCode": null,
    "origin": "JP",
    "supersededTo": [],
    "stockParts": [],
    "prices": [
      {
        "countryIntegrationID": "TM",
        "countryName": "Turkmenistan ",
        "regionIntegrationID": "TK",
        "regionName": "Turkmenistan ",
        "warrantyPrice": 4.60714285714286,
        "fob": 2.6875,
        "price": 4.03125
      },
      {
        "countryIntegrationID": "TJ",
        "countryName": "Tajikistan",
        "regionIntegrationID": "TJ",
        "regionName": "Tajikistan",
        "warrantyPrice": 4.60714285714286,
        "fob": 2.6875,
        "price": 4.03125
      },
      {
        "countryIntegrationID": "UZ",
        "countryName": "Uzbekistan",
        "regionIntegrationID": "UZ",
        "regionName": "Uzbekistan",
        "warrantyPrice": 4.60714285714286,
        "fob": 38254.6428571429,
        "price": 57400
      }
    ],
    "deadStock": null
  },
  'SU00302474/1': {
    "partNumber": "0400007660",
    "partDescription": "REPLACEMENT KIT,",
    "localDescription": "Неприменимо",
    "group": "J",
    "pnc": "",
    "pncLocalName": "",
    "binCode": null,
    "dimension1": 75,
    "dimension2": 60,
    "dimension3": 10,
    "netWeight": 226,
    "grossWeight": null,
    "cubicMeasure": 450,
    "hsCode": null,
    "uzhsCode": null,
    "origin": "JP",
    "supersededTo": [],
    "stockParts": [
      {
        "quantityLookUpResult": "Available",
        "locationID": "UZ-UZ-BS",
        "locationName": "Besten Stock"
      }
    ],
    "prices": [
      {
        "countryIntegrationID": "TM",
        "countryName": "Turkmenistan ",
        "regionIntegrationID": "TK",
        "regionName": "Turkmenistan ",
        "warrantyPrice": 4.26428571428571,
        "fob": 2.4875,
        "price": 3.73125
      },
      {
        "countryIntegrationID": "TJ",
        "countryName": "Tajikistan",
        "regionIntegrationID": "TJ",
        "regionName": "Tajikistan",
        "warrantyPrice": 4.26428571428571,
        "fob": 2.4875,
        "price": 3.73125
      },
      {
        "countryIntegrationID": "UZ",
        "countryName": "Uzbekistan",
        "regionIntegrationID": "UZ",
        "regionName": "Uzbekistan",
        "warrantyPrice": 4.26428571428571,
        "fob": 35407.7857142857,
        "price": 53100
      }
    ],
    "deadStock": null,
    "logId": "d864e3b6-4b6b-4d22-be99-7d64063446eb"
  },
  'T5245160030/11': {
    partNumber: 'T5245160030',
    tmcPart: {
      partDescription: 'GUARD, RR BUMPER    ',
      group: 'C',
    },
    stockParts: [
      {
        partDescription: 'GUARD, RR BUMPER',
        supersededTo: ' ',
        supersededFrom: ' ',
        quantityLookUpResult: 'QuantityNotWithinLookupThreshold',
        price: 122.2700004,
        group: 'C',
        locationID: '1-1',
        locationName: 'Location #1',
      },
      {
        partDescription: 'GUARD, RR BUMPER',
        supersededTo: ' ',
        supersededFrom: ' ',
        quantityLookUpResult: 'QuantityNotWithinLookupThreshold',
        price: 122.2700004,
        group: 'C',
        locationID: '2-2',
        locationName: 'Location #2',
      },
      {
        partDescription: 'GUARD, RR BUMPER',
        supersededTo: ' ',
        supersededFrom: ' ',
        quantityLookUpResult: 'QuantityNotWithinLookupThreshold',
        price: 122.2700004,
        group: 'C',
        locationID: '3-3',
        locationName: 'Location #3',
      },
    ],
    deadStock: [
      {
        companyIntegrationID: '1',
        companyName: 'Dealer 1',
        branchDeadStock: [
          {
            companyBranchIntegrationID: '4',
            companyBranchName: 'Location #1',
            quantity: 10,
          },
          {
            companyBranchIntegrationID: '2',
            companyBranchName: 'Location #2',
            quantity: 2,
          },
        ],
      },
      {
        companyIntegrationID: '2',
        companyName: 'Dealer 2',
        branchDeadStock: [
          {
            companyBranchIntegrationID: '5',
            companyBranchName: 'Location #3',
            quantity: 6,
          },
          {
            companyBranchIntegrationID: '9',
            companyBranchName: 'Location #5',
            quantity: 5,
          },
        ],
      },
    ],
  },
};
