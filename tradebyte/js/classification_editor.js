class Classification {
    Structure;
    Components;
    Tags;
    Brands;
    Logos;
    AttributeSets;
    SubSuppliers;
    Languages;
    ShippingGroups;
    Grids;
    MediaTypes;
    
    type = "merge";
    targetChannel;
    key;
    active = true;
    
}

class Structure {
    id;
    identifier;
    key;
    name;
    exportKey;
    minOccurs = 0;
    maxOccurs = "1";
    hasMapping = "first";
    
    StructureItems = [];
}

class StructureItem {
    key;
    name;
    parentID = 0;
    sort = 0;
    shortDescribtion = "";
    describition = "";
    metaTitle = "";
    metaKeywords = "";
    metaDescribtion = "";

    attributeSets = [];
    attributes = [];
}

class Component {
    
}