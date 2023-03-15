import { Property, httpClient, HttpRequest, HttpResponse, AuthenticationType, HttpMethod } from "@activepieces/framework";

// Login to Google Business
export const googleBusinessCommon = {
    authentication: Property.OAuth2({
        displayName: 'Authentication',
        authUrl: "https://accounts.google.com/o/oauth2/auth",
        tokenUrl: "https://oauth2.googleapis.com/token",
        required: true,
        scope: ["https://www.googleapis.com/auth/business.manage"]
    }),
    baseUrl: `https://mybusiness.googleapis.com/v4/`,
    subscribeWebhook: async (accountId: string, locationId: string, tag: string, webhookUrl: string, accessToken: string) => {
        const request: HttpRequest = {
            method: HttpMethod.PUT,
            url: `${googleBusinessCommon.baseUrl}/accounts/${accountId}/locations/${locationId}/webhooks/${tag}`,
            headers: {
                "Content-Type": "application/json"
            },
            body: {
                enabled: true,
                url: webhookUrl
            },
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: accessToken,
            },
            queryParams: {},
        };

        await httpClient.sendRequest(request);
    },
    unsubscribeWebhook: async (accountId: string, locationId: string, tag: string, accessToken: string) => {
        const request: HttpRequest = {
            method: HttpMethod.DELETE,
            url: `${googleBusinessCommon.baseUrl}/accounts/${accountId}/locations/${locationId}/webhooks/${tag}`,
            headers: {
                "Content-Type": "application/json"
            },
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: accessToken,
            },
        };
        await httpClient.sendRequest(request);
    }
}

// Select a Google Business Account
// https://developers.google.com/my-business/content/account-data?hl=en
export const googleBusinessAccountCommon = {
    // GET https://mybusinessaccountmanagement.googleapis.com/v1/accounts
    
}

// Select a Google Business Location
// https://developers.google.com/my-business/content/location-data?hl=en
export const googleBusinessLocationCommon = {
    // scope: ["https://www.googleapis.com/auth/business.manage"]
    // GET https://mybusinessaccountmanagement.googleapis.com/v1/accounts/{accountId}/locations
}