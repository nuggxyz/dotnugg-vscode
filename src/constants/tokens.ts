const content = '.content';
const open = '.open';
const close = '.close';
const direction = '.direction';
const offset = '.offset';
const feature = '.feature';
const base = '.base';
const collection = '.collection';
const colors = '.colors';
const color = '.color';
const features = '.features';
const level = '.level';
const key = '.key';
const version = '.version';
const expanders = '.expanders';
const anchor = '.anchor';
const radii = '.radii';
const data = '.data';
const versions = '.versions';
const filters = '.filters';
const filter = '.filter';
const general = '.general';
const row = '.row';
const pixel = '.pixel';
const name = '.name';
const rgba = '.rgba';
const type = '.type';
const arg = '.arg';
const details = '.details';
const transparent = '.transparent';
const attribute = '.attribute';
const dotnugg = 'dotnugg';
const defaultOrAttribute = '.defaultOrAttribute';
const l = '.l';
const r = '.r';
const u = '.u';
const d = '.d';
const x = '.x';
const y = '.y';

const General = dotnugg + general;
const Attribute = dotnugg + attribute;
const Base = dotnugg + base;
const Collection = dotnugg + collection;

const AttributeContent = Attribute + content;
const AttributeOpen = Attribute + open;
const AttributeOpenFeature = AttributeOpen + feature;
const AttributeOpenDefaultOrAttribute = AttributeOpen + defaultOrAttribute;

const AttributeClose = Attribute + close;
const AttributeColors = Attribute + colors;
const AttributeColor = Attribute + color;

const AttributeVersions = Attribute + versions;
const AttributeVersion = Attribute + version;
const AttributeVersionData = AttributeVersion + data;

const AttributeVersionRadii = AttributeVersion + radii;
const AttributeVersionRadiiDetails = AttributeVersionRadii + details;
const AttributeVersionRadiiDetailsR = AttributeVersionRadiiDetails + r;
const AttributeVersionRadiiDetailsL = AttributeVersionRadiiDetails + l;
const AttributeVersionRadiiDetailsU = AttributeVersionRadiiDetails + u;
const AttributeVersionRadiiDetailsD = AttributeVersionRadiiDetails + d;

const AttributeVersionExpanders = AttributeVersion + expanders;
const AttributeVersionExpandersDetails = AttributeVersionExpanders + details;
const AttributeVersionExpandersDetailsR = AttributeVersionExpandersDetails + r;
const AttributeVersionExpandersDetailsL = AttributeVersionExpandersDetails + l;
const AttributeVersionExpandersDetailsU = AttributeVersionExpandersDetails + u;
const AttributeVersionExpandersDetailsD = AttributeVersionExpandersDetails + d;
const AttributeVersionAnchor = AttributeVersion + anchor;
const AttributeVersionAnchorDetails = AttributeVersionAnchor + details;
const AttributeVersionAnchorDetailsX = AttributeVersionAnchorDetails + x;
const AttributeVersionAnchorDetailsY = AttributeVersionAnchorDetails + y;

const AttributeVersionName = AttributeVersion + name;

const AttributeColorsOpen = AttributeColors + open;
const AttributeVersionsOpen = AttributeVersions + open;
const AttributeVersionOpen = AttributeVersion + open;
const AttributeVersionDataOpen = AttributeVersionData + open;

const AttributeColorsClose = AttributeColors + close;
const AttributeVersionsClose = AttributeVersions + close;
const AttributeVersionClose = AttributeVersion + close;
const AttributeVersionDataClose = AttributeVersionData + close;

const BaseColor = Base + color;
const BaseFilter = Base + filter;
const BaseColors = Base + colors;
const BaseFilters = Base + filters;
const BaseData = Base + data;
const BaseOpen = Base + open;
const BaseClose = Base + close;
const CollectionOpen = Collection + open;
const CollectionClose = Collection + close;
const BaseColorsOpen = BaseColors + open;
const BaseFiltersOpen = BaseFilters + open;
const BaseDataOpen = BaseData + open;
const BaseColorsClose = BaseColors + close;
const BaseFiltersClose = BaseFilters + close;
const BaseDataClose = BaseData + close;

const CollectionColors = Collection + colors;
const CollectionColor = Collection + color;

const CollectionColorsOpen = CollectionColors + open;
const CollectionColorsClose = CollectionColors + close;

const CollectionFeature = Collection + feature;
const CollectionFeatureName = CollectionFeature + name;

const CollectionFeatureDetails = CollectionFeature + details;
const CollectionFeatureDetailsClose = CollectionFeatureDetails + close;

const CollectionFeatureDetailsAnchor = CollectionFeatureDetails + anchor;
const CollectionFeatureDetailsLevel = CollectionFeatureDetails + level;
const CollectionFeatureDetailsAnchorKey = CollectionFeatureDetailsAnchor + key;
const CollectionFeatureDetailsAnchorDirection = CollectionFeatureDetailsAnchor + direction;
const CollectionFeatureDetailsAnchorOffset = CollectionFeatureDetailsAnchor + offset;
const CollectionFeatureDetailsLevelDirection = CollectionFeatureDetailsLevel + direction;
const CollectionFeatureDetailsLevelOffset = CollectionFeatureDetailsLevel + offset;
const CollectionFeatures = Collection + features;
const CollectionFeaturesOpen = CollectionFeatures + open;
const CollectionFeaturesClose = CollectionFeatures + close;

const GeneralFilters = General + filters;
const GeneralFilter = General + filter;
const GeneralFilterDetails = GeneralFilter + details;

const GeneralFilterName = GeneralFilter + name;
const GeneralFilterDetailsType = GeneralFilterDetails + type;
const GeneralFilterDetailsArg = GeneralFilterDetails + arg;

const GeneralFilterDetailsLevel = GeneralFilterDetails + level;
const GeneralFilterDetailsLevelOffset = GeneralFilterDetailsLevel + offset;
const GeneralFilterDetailsLevelDirection = GeneralFilterDetailsLevel + direction;
const GeneralColors = General + colors;
const GeneralColor = General + color;
const GeneralColorDetails = GeneralColor + details;
const GeneralColorName = GeneralColor + name;
const GeneralColorDetailsLevel = GeneralColorDetails + level;
const GeneralColorDetailsLevelOffset = GeneralColorDetailsLevel + offset;
const GeneralColorDetailsLevelDirection = GeneralColorDetailsLevel + direction;
const GeneralColorDetailsRgba = GeneralColorDetails + rgba;

const GeneralData = General + data;
const GeneralDataRow = GeneralData + row;
const GeneralDataRowPixel = GeneralDataRow + pixel;
const GeneralDataRowPixelTransparent = GeneralDataRowPixel + transparent;
const GeneralDataRowPixelFilter = GeneralDataRowPixel + filter;
const GeneralDataRowPixelColor = GeneralDataRowPixel + color;

const GeneralFiltersOpen = GeneralFilters + open;
const GeneralColorsOpen = GeneralColors + open;
const GeneralDataOpen = GeneralData + open;
const GeneralFiltersClose = GeneralFilters + close;
const GeneralColorsClose = GeneralColors + close;
const GeneralDataClose = GeneralData + close;

const CollectionFeatureClose = CollectionFeature + close;
const GeneralColorDetailsClose = GeneralColorDetails + close;
const GeneralFilterDetailsClose = GeneralFilterDetails + close;
const AttributeVersionRadiiDetailsClose = AttributeVersionRadiiDetails + close;
const AttributeVersionExpandersDetailsClose = AttributeVersionExpandersDetails + close;
const AttributeVersionAnchorDetailsClose = AttributeVersionAnchorDetails + close;

const CollectionFeatureDetailsRadii = CollectionFeatureDetails + radii;
const CollectionFeatureDetailsRadiiDetails = CollectionFeatureDetailsRadii + details;
const CollectionFeatureDetailsRadiiDetailsR = CollectionFeatureDetailsRadiiDetails + r;
const CollectionFeatureDetailsRadiiDetailsL = CollectionFeatureDetailsRadiiDetails + l;
const CollectionFeatureDetailsRadiiDetailsU = CollectionFeatureDetailsRadiiDetails + u;
const CollectionFeatureDetailsRadiiDetailsD = CollectionFeatureDetailsRadiiDetails + d;

export default {
    Attribute,
    AttributeContent,
    AttributeOpen,
    AttributeOpenFeature,
    AttributeClose,
    AttributeColors,
    AttributeVersion,
    AttributeVersions,
    AttributeVersionRadii,
    AttributeVersionExpanders,
    AttributeVersionAnchor,
    AttributeVersionData,
    Base,
    BaseData,
    BaseFilters,
    BaseColors,
    Collection,
    AttributeColorsOpen,
    AttributeVersionsOpen,
    AttributeVersionOpen,
    AttributeVersionDataOpen,
    AttributeColorsClose,
    AttributeVersionsClose,
    AttributeVersionClose,
    AttributeVersionDataClose,
    BaseColorsOpen,
    BaseFiltersOpen,
    BaseDataOpen,
    BaseColorsClose,
    BaseFiltersClose,
    BaseDataClose,
    CollectionColors,
    CollectionColorsOpen,
    CollectionColorsClose,
    CollectionFeature,
    CollectionFeatures,
    CollectionFeaturesOpen,
    CollectionFeaturesClose,
    GeneralFilters,
    GeneralFilter,
    GeneralColors,
    GeneralColor,
    GeneralData,
    GeneralDataRow,
    GeneralDataRowPixel,
    GeneralFiltersOpen,
    GeneralColorsOpen,
    GeneralDataOpen,
    GeneralFiltersClose,
    GeneralColorsClose,
    GeneralDataClose,
    BaseOpen,
    BaseClose,
    CollectionOpen,
    CollectionClose,
    CollectionColor,
    BaseColor,
    BaseFilter,
    AttributeColor,
    CollectionFeatureDetailsLevel,
    CollectionFeatureDetailsAnchor,
    CollectionFeatureName,
    CollectionFeatureDetailsAnchorKey,
    CollectionFeatureDetailsAnchorDirection,
    CollectionFeatureDetailsAnchorOffset,
    CollectionFeatureDetailsLevelDirection,
    CollectionFeatureDetailsLevelOffset,
    GeneralColorDetailsLevelOffset,
    GeneralColorDetailsLevelDirection,
    GeneralColorDetails,
    GeneralColorDetailsLevel,
    GeneralColorName,
    GeneralColorDetailsRgba,
    GeneralFilterDetails,
    GeneralFilterName,
    GeneralFilterDetailsLevel,
    GeneralFilterDetailsLevelOffset,
    GeneralFilterDetailsLevelDirection,
    GeneralFilterDetailsType,
    GeneralFilterDetailsArg,
    GeneralDataRowPixelTransparent,
    GeneralDataRowPixelFilter,
    GeneralDataRowPixelColor,
    AttributeVersionName,
    AttributeVersionRadiiDetails,
    AttributeVersionRadiiDetailsR,
    AttributeVersionRadiiDetailsL,
    AttributeVersionRadiiDetailsU,
    AttributeVersionRadiiDetailsD,
    AttributeVersionExpandersDetails,
    AttributeVersionExpandersDetailsR,
    AttributeVersionExpandersDetailsL,
    AttributeVersionExpandersDetailsU,
    AttributeVersionExpandersDetailsD,
    AttributeVersionAnchorDetails,
    AttributeVersionAnchorDetailsX,
    AttributeVersionAnchorDetailsY,
    CollectionFeatureClose,
    CollectionFeatureDetailsClose,
    AttributeVersionRadiiDetailsClose,
    AttributeVersionExpandersDetailsClose,
    GeneralColorDetailsClose,
    GeneralFilterDetailsClose,
    AttributeVersionAnchorDetailsClose,
    CollectionFeatureDetailsRadii,
    CollectionFeatureDetailsRadiiDetails,
    CollectionFeatureDetailsRadiiDetailsR,
    CollectionFeatureDetailsRadiiDetailsL,
    CollectionFeatureDetailsRadiiDetailsU,
    CollectionFeatureDetailsRadiiDetailsD,
    AttributeOpenDefaultOrAttribute,
};
