import { faker } from "@faker-js/faker";

const DYNAMIC_GENERATORS = {
  $guid: () => faker.string.uuid(),
  $timestamp: () => String(Math.floor(Date.now() / 1000)),
  $isoTimestamp: () => new Date().toISOString(),
  $randomUUID: () => faker.string.uuid(),

  $randomAlphaNumeric: () => faker.string.alphanumeric(1),
  $randomBoolean: () => String(faker.datatype.boolean()),
  $randomInt: () => String(faker.number.int({ min: 0, max: 1000 })),
  $randomColor: () => faker.color.human(),
  $randomHexColor: () => faker.internet.color(),
  $randomAbbreviation: () => faker.string.alpha({ length: 3, casing: "upper" }),

  $randomIP: () => faker.internet.ipv4(),
  $randomIPV6: () => faker.internet.ipv6(),
  $randomMACAddress: () => faker.internet.mac(),
  $randomPassword: () => faker.internet.password({ length: 15 }),
  $randomLocale: () => faker.location.countryCode("alpha-2"),
  $randomUserAgent: () => faker.internet.userAgent(),
  $randomProtocol: () => faker.helpers.arrayElement(["http", "https"]),
  $randomSemver: () => faker.system.semver(),

  $randomFirstName: () => faker.person.firstName(),
  $randomLastName: () => faker.person.lastName(),
  $randomFullName: () => faker.person.fullName(),
  $randomNamePrefix: () => faker.person.prefix(),
  $randomNameSuffix: () => faker.person.suffix(),

  $randomJobArea: () => faker.person.jobArea(),
  $randomJobDescriptor: () => faker.person.jobDescriptor(),
  $randomJobTitle: () => faker.person.jobTitle(),
  $randomJobType: () => faker.person.jobType(),

  $randomPhoneNumber: () => faker.phone.number(),
  $randomPhoneNumberExt: () => faker.phone.number(),
  $randomCity: () => faker.location.city(),
  $randomStreetName: () => faker.location.street(),
  $randomStreetAddress: () => faker.location.streetAddress(),
  $randomCountry: () => faker.location.country(),
  $randomCountryCode: () => faker.location.countryCode(),
  $randomLatitude: () => String(faker.location.latitude()),
  $randomLongitude: () => String(faker.location.longitude()),

  $randomAvatarImage: () => faker.image.avatar(),
  $randomImageUrl: () => faker.image.url(),
  $randomAbstractImage: () => faker.image.urlLoremFlickr({ category: "abstract" }),
  $randomAnimalsImage: () => faker.image.urlLoremFlickr({ category: "animals" }),
  $randomBusinessImage: () => faker.image.urlLoremFlickr({ category: "business" }),
  $randomCatsImage: () => faker.image.urlLoremFlickr({ category: "cats" }),
  $randomCityImage: () => faker.image.urlLoremFlickr({ category: "city" }),
  $randomFoodImage: () => faker.image.urlLoremFlickr({ category: "food" }),
  $randomNightlifeImage: () => faker.image.urlLoremFlickr({ category: "nightlife" }),
  $randomFashionImage: () => faker.image.urlLoremFlickr({ category: "fashion" }),
  $randomPeopleImage: () => faker.image.urlLoremFlickr({ category: "people" }),
  $randomNatureImage: () => faker.image.urlLoremFlickr({ category: "nature" }),
  $randomSportsImage: () => faker.image.urlLoremFlickr({ category: "sports" }),
  $randomTransportImage: () => faker.image.urlLoremFlickr({ category: "transport" }),
  $randomImageDataUri: () => faker.image.dataUri(),

  $randomBankAccount: () => faker.finance.accountNumber(8),
  $randomBankAccountName: () => faker.finance.accountName(),
  $randomCreditCardMask: () => faker.finance.creditCardCVV(),
  $randomBankAccountBic: () => faker.finance.bic(),
  $randomBankAccountIban: () => faker.finance.iban(),
  $randomTransactionType: () => faker.helpers.arrayElement(["invoice", "payment", "deposit"]),
  $randomCurrencyCode: () => faker.finance.currencyCode(),
  $randomCurrencyName: () => faker.finance.currencyName(),
  $randomCurrencySymbol: () => faker.finance.currencySymbol(),
  $randomBitcoin: () => faker.finance.bitcoinAddress(),

  $randomCompanyName: () => faker.company.name(),
  $randomCompanySuffix: () => faker.company.buzzNoun(),
  $randomBs: () => faker.company.catchPhrase(),
  $randomBsAdjective: () => faker.company.buzzAdjective(),
  $randomBsBuzz: () => faker.company.buzzVerb(),
  $randomBsNoun: () => faker.company.buzzNoun(),

  $randomCatchPhrase: () => faker.company.catchPhrase(),
  $randomCatchPhraseAdjective: () => faker.company.catchPhraseAdjective(),
  $randomCatchPhraseDescriptor: () => faker.company.catchPhraseDescriptor(),
  $randomCatchPhraseNoun: () => faker.company.catchPhraseNoun(),

  $randomDatabaseColumn: () => faker.database.column(),
  $randomDatabaseType: () => faker.database.type(),
  $randomDatabaseCollation: () => faker.database.collation(),
  $randomDatabaseEngine: () => faker.database.engine(),

  $randomDateFuture: () => faker.date.future().toString(),
  $randomDatePast: () => faker.date.past().toString(),
  $randomDateRecent: () => faker.date.recent().toString(),
  $randomWeekday: () => faker.date.weekday(),
  $randomMonth: () => faker.date.month(),

  $randomDomainName: () => faker.internet.domainName(),
  $randomDomainSuffix: () => faker.internet.domainSuffix(),
  $randomDomainWord: () => faker.internet.domainWord(),
  $randomEmail: () => faker.internet.email(),
  $randomExampleEmail: () => faker.internet.exampleEmail(),
  $randomUserName: () => faker.internet.userName(),
  $randomUrl: () => faker.internet.url(),

  $randomFileName: () => faker.system.fileName(),
  $randomFileType: () => faker.system.fileType(),
  $randomFileExt: () => faker.system.fileExt(),
  $randomCommonFileName: () => faker.system.commonFileName(),
  $randomCommonFileType: () => faker.system.commonFileType(),
  $randomCommonFileExt: () => faker.system.commonFileExt(),
  $randomFilePath: () => faker.system.filePath(),
  $randomDirectoryPath: () => faker.system.directoryPath(),
  $randomMimeType: () => faker.system.mimeType(),

  $randomPrice: () => faker.commerce.price({ min: 0, max: 1000 }),
  $randomProduct: () => faker.commerce.product(),
  $randomProductAdjective: () => faker.commerce.productAdjective(),
  $randomProductMaterial: () => faker.commerce.productMaterial(),
  $randomProductName: () => faker.commerce.productName(),
  $randomDepartment: () => faker.commerce.department(),

  $randomNoun: () => faker.word.noun(),
  $randomVerb: () => faker.word.verb(),
  $randomIngverb: () => `${faker.word.verb()}ing`,
  $randomAdjective: () => faker.word.adjective(),
  $randomWord: () => faker.word.sample(),
  $randomWords: () => faker.lorem.words(faker.number.int({ min: 2, max: 5 })),
  $randomPhrase: () => faker.lorem.sentence(),

  $randomLoremWord: () => faker.lorem.word(),
  $randomLoremWords: () => faker.lorem.words(faker.number.int({ min: 2, max: 4 })),
  $randomLoremSentence: () => faker.lorem.sentence(),
  $randomLoremSentences: () => faker.lorem.sentences(faker.number.int({ min: 2, max: 6 })),
  $randomLoremParagraph: () => faker.lorem.paragraph(),
  $randomLoremParagraphs: () => faker.lorem.paragraphs(3),
  $randomLoremText: () => faker.lorem.text(),
  $randomLoremSlug: () => faker.lorem.slug(),
  $randomLoremLines: () => faker.lorem.lines(faker.number.int({ min: 1, max: 5 })),
};

export function isDynamicVariable(name) {
  return typeof name === "string" && name.startsWith("$") && Boolean(DYNAMIC_GENERATORS[name]);
}

export function resolveDynamicVariable(name) {
  const generator = DYNAMIC_GENERATORS[name];
  if (!generator) return null;
  const value = generator();
  return value == null ? "" : String(value);
}

export function listDynamicVariables() {
  return Object.keys(DYNAMIC_GENERATORS);
}
