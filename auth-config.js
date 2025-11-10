export default {
    endpoint: "auth",
    configureEndpoints: ["auth", "core", "production", "production-azure", "purchasing", "purchasing-azure", "garment-purchasing", "inventory", "inventory-azure", "garment-master-plan", "int-purchasing", "customs-report", "merchandiser", "deal-tracking", "sales", "spinning", "weaving", "finance", "garment-production", "packing-inventory", "dyeing","dl-report"    
    ],
    loginUrl: "authenticate",
    profileUrl: "me",

    // Redirect configuration
    loginRoute: 'login',
    loginRedirect: '/',
    
    authTokenType: "Bearer",
    accessTokenProp: "data",

    storageChangedReload: true
};
