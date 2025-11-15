import type {
  OpenAPIClient,
  Parameters,
  UnknownParamsObject,
  OperationResponse,
  AxiosRequestConfig,
} from 'openapi-client-axios';

declare namespace Paths {
    namespace GetShopItems {
        namespace Responses {
            export type $200 = {
                id: number;
                name: string;
                type: number;
                value: number;
                description?: string;
                thumbnail?: string;
                price: number;
                owned: boolean;
            }[];
        }
    }
    namespace GetShopItemsById {
        namespace Parameters {
            export type Id = string;
        }
        export interface PathParameters {
            id: Parameters.Id;
        }
        namespace Responses {
            export interface $200 {
                id: number;
                name: string;
                type: number;
                value: number;
                description?: string;
                thumbnail?: string;
                price: number;
                owned: boolean;
            }
            export interface $404 {
                error: string;
            }
        }
    }
    namespace GetUsersMe {
        namespace Responses {
            export interface $200 {
                id: string;
                name: string;
                email: string;
                emailVerified: boolean;
                image?: string;
                createdAt: string;
                updatedAt: string;
                authenticators: string;
                avatar_emote: number;
                avatar_eyes?: number | null;
                avatar_hair?: number | null;
                avatar_mouth?: number | null;
                dollars: number;
                game_name?: string | null;
            }
            export interface $404 {
                message: string;
            }
        }
    }
    namespace GetUsersOwned {
        namespace Responses {
            export interface $200 {
                [pattern: string]: {
                    item_id: number;
                    shop: {
                        id: number;
                        name: string;
                        type: number;
                        value: number;
                        description?: string;
                        thumbnail?: string;
                        price: number;
                    };
                }[]; /* Patterns: ^(.*)$ */
            }
            export interface $404 {
                message: string;
            }
        }
    }
    namespace GetUsersStats {
        namespace Responses {
            export interface $200 {
                playerSince: string;
                totalPromptsAnswered: number;
                totalGamesPlayed: number;
                totalDoubloonsWon: number;
                totalDrinksTaken: number;
                totalWins: number;
            }
            export interface $404 {
                message: string;
            }
        }
    }
    namespace PostShopCreatePaymentIntent {
        export interface RequestBody {
            shop_id: number;
        }
        namespace Responses {
            export interface $200 {
                clientSecret: string;
            }
            export interface $400 {
                error: string;
            }
            export interface $401 {
                error: string;
            }
            export interface $404 {
                error: string;
            }
        }
    }
    namespace PutUsersAvatar {
        export interface RequestBody {
            avatar_emote: number;
            avatar_eyes?: number | null;
            avatar_hair?: number | null;
            avatar_mouth?: number | null;
        }
        namespace Responses {
            export interface $200 {
                id: string;
                name: string;
                email: string;
                emailVerified: boolean;
                image?: string;
                createdAt: string;
                updatedAt: string;
                authenticators: string;
                avatar_emote: number;
                avatar_eyes?: number | null;
                avatar_hair?: number | null;
                avatar_mouth?: number | null;
                dollars: number;
                game_name?: string | null;
            }
            export interface $404 {
                message: string;
            }
        }
    }
}


export interface OperationMethods {
  /**
   * getUsersMe - Get current user information
   */
  'getUsersMe'(
    parameters?: Parameters<UnknownParamsObject> | null,
    data?: any,
    config?: AxiosRequestConfig  
  ): OperationResponse<Paths.GetUsersMe.Responses.$200>
  /**
   * getUsersStats - Get user statistics
   */
  'getUsersStats'(
    parameters?: Parameters<UnknownParamsObject> | null,
    data?: any,
    config?: AxiosRequestConfig  
  ): OperationResponse<Paths.GetUsersStats.Responses.$200>
  /**
   * getUsersOwned - Get user owned items grouped by type
   */
  'getUsersOwned'(
    parameters?: Parameters<UnknownParamsObject> | null,
    data?: any,
    config?: AxiosRequestConfig  
  ): OperationResponse<Paths.GetUsersOwned.Responses.$200>
  /**
   * putUsersAvatar - Update user avatar
   */
  'putUsersAvatar'(
    parameters?: Parameters<UnknownParamsObject> | null,
    data?: Paths.PutUsersAvatar.RequestBody,
    config?: AxiosRequestConfig  
  ): OperationResponse<Paths.PutUsersAvatar.Responses.$200>
  /**
   * getShopItems - Get all shop items with ownership status
   */
  'getShopItems'(
    parameters?: Parameters<UnknownParamsObject> | null,
    data?: any,
    config?: AxiosRequestConfig  
  ): OperationResponse<Paths.GetShopItems.Responses.$200>
  /**
   * getShopItemsById - Get shop item by id
   */
  'getShopItemsById'(
    parameters?: Parameters<Paths.GetShopItemsById.PathParameters> | null,
    data?: any,
    config?: AxiosRequestConfig  
  ): OperationResponse<Paths.GetShopItemsById.Responses.$200>
  /**
   * postShopWebhook - Handle Stripe webhook for payment events
   */
  'postShopWebhook'(
    parameters?: Parameters<UnknownParamsObject> | null,
    data?: any,
    config?: AxiosRequestConfig  
  ): OperationResponse<any>
  /**
   * postShopCreate-payment-intent - Create payment intent for purchasing a shop item
   */
  'postShopCreate-payment-intent'(
    parameters?: Parameters<UnknownParamsObject> | null,
    data?: Paths.PostShopCreatePaymentIntent.RequestBody,
    config?: AxiosRequestConfig  
  ): OperationResponse<Paths.PostShopCreatePaymentIntent.Responses.$200>
  /**
   * allApiAuth*
   */
  'allApiAuth*'(
    parameters?: Parameters<UnknownParamsObject> | null,
    data?: any,
    config?: AxiosRequestConfig  
  ): OperationResponse<any>
  /**
   * allApiAuth*
   */
  'allApiAuth*'(
    parameters?: Parameters<UnknownParamsObject> | null,
    data?: any,
    config?: AxiosRequestConfig  
  ): OperationResponse<any>
  /**
   * allApiAuth*
   */
  'allApiAuth*'(
    parameters?: Parameters<UnknownParamsObject> | null,
    data?: any,
    config?: AxiosRequestConfig  
  ): OperationResponse<any>
  /**
   * allApiAuth*
   */
  'allApiAuth*'(
    parameters?: Parameters<UnknownParamsObject> | null,
    data?: any,
    config?: AxiosRequestConfig  
  ): OperationResponse<any>
  /**
   * allApiAuth*
   */
  'allApiAuth*'(
    parameters?: Parameters<UnknownParamsObject> | null,
    data?: any,
    config?: AxiosRequestConfig  
  ): OperationResponse<any>
  /**
   * allApiAuth*
   */
  'allApiAuth*'(
    parameters?: Parameters<UnknownParamsObject> | null,
    data?: any,
    config?: AxiosRequestConfig  
  ): OperationResponse<any>
  /**
   * allApiAuth*
   */
  'allApiAuth*'(
    parameters?: Parameters<UnknownParamsObject> | null,
    data?: any,
    config?: AxiosRequestConfig  
  ): OperationResponse<any>
  /**
   * allApiAuth*
   */
  'allApiAuth*'(
    parameters?: Parameters<UnknownParamsObject> | null,
    data?: any,
    config?: AxiosRequestConfig  
  ): OperationResponse<any>
  /**
   * getIndex
   */
  'getIndex'(
    parameters?: Parameters<UnknownParamsObject> | null,
    data?: any,
    config?: AxiosRequestConfig  
  ): OperationResponse<any>
  /**
   * getStatic*
   */
  'getStatic*'(
    parameters?: Parameters<UnknownParamsObject> | null,
    data?: any,
    config?: AxiosRequestConfig  
  ): OperationResponse<any>
}

export interface PathsDictionary {
  ['/users/me']: {
    /**
     * getUsersMe - Get current user information
     */
    'get'(
      parameters?: Parameters<UnknownParamsObject> | null,
      data?: any,
      config?: AxiosRequestConfig  
    ): OperationResponse<Paths.GetUsersMe.Responses.$200>
  }
  ['/users/stats']: {
    /**
     * getUsersStats - Get user statistics
     */
    'get'(
      parameters?: Parameters<UnknownParamsObject> | null,
      data?: any,
      config?: AxiosRequestConfig  
    ): OperationResponse<Paths.GetUsersStats.Responses.$200>
  }
  ['/users/owned']: {
    /**
     * getUsersOwned - Get user owned items grouped by type
     */
    'get'(
      parameters?: Parameters<UnknownParamsObject> | null,
      data?: any,
      config?: AxiosRequestConfig  
    ): OperationResponse<Paths.GetUsersOwned.Responses.$200>
  }
  ['/users/avatar']: {
    /**
     * putUsersAvatar - Update user avatar
     */
    'put'(
      parameters?: Parameters<UnknownParamsObject> | null,
      data?: Paths.PutUsersAvatar.RequestBody,
      config?: AxiosRequestConfig  
    ): OperationResponse<Paths.PutUsersAvatar.Responses.$200>
  }
  ['/shop/items']: {
    /**
     * getShopItems - Get all shop items with ownership status
     */
    'get'(
      parameters?: Parameters<UnknownParamsObject> | null,
      data?: any,
      config?: AxiosRequestConfig  
    ): OperationResponse<Paths.GetShopItems.Responses.$200>
  }
  ['/shop/items/{id}']: {
    /**
     * getShopItemsById - Get shop item by id
     */
    'get'(
      parameters?: Parameters<Paths.GetShopItemsById.PathParameters> | null,
      data?: any,
      config?: AxiosRequestConfig  
    ): OperationResponse<Paths.GetShopItemsById.Responses.$200>
  }
  ['/shop/webhook']: {
    /**
     * postShopWebhook - Handle Stripe webhook for payment events
     */
    'post'(
      parameters?: Parameters<UnknownParamsObject> | null,
      data?: any,
      config?: AxiosRequestConfig  
    ): OperationResponse<any>
  }
  ['/shop/create-payment-intent']: {
    /**
     * postShopCreate-payment-intent - Create payment intent for purchasing a shop item
     */
    'post'(
      parameters?: Parameters<UnknownParamsObject> | null,
      data?: Paths.PostShopCreatePaymentIntent.RequestBody,
      config?: AxiosRequestConfig  
    ): OperationResponse<Paths.PostShopCreatePaymentIntent.Responses.$200>
  }
  ['/api/auth/*']: {
    /**
     * allApiAuth*
     */
    'get'(
      parameters?: Parameters<UnknownParamsObject> | null,
      data?: any,
      config?: AxiosRequestConfig  
    ): OperationResponse<any>
    /**
     * allApiAuth*
     */
    'post'(
      parameters?: Parameters<UnknownParamsObject> | null,
      data?: any,
      config?: AxiosRequestConfig  
    ): OperationResponse<any>
    /**
     * allApiAuth*
     */
    'put'(
      parameters?: Parameters<UnknownParamsObject> | null,
      data?: any,
      config?: AxiosRequestConfig  
    ): OperationResponse<any>
    /**
     * allApiAuth*
     */
    'delete'(
      parameters?: Parameters<UnknownParamsObject> | null,
      data?: any,
      config?: AxiosRequestConfig  
    ): OperationResponse<any>
    /**
     * allApiAuth*
     */
    'patch'(
      parameters?: Parameters<UnknownParamsObject> | null,
      data?: any,
      config?: AxiosRequestConfig  
    ): OperationResponse<any>
    /**
     * allApiAuth*
     */
    'head'(
      parameters?: Parameters<UnknownParamsObject> | null,
      data?: any,
      config?: AxiosRequestConfig  
    ): OperationResponse<any>
    /**
     * allApiAuth*
     */
    'options'(
      parameters?: Parameters<UnknownParamsObject> | null,
      data?: any,
      config?: AxiosRequestConfig  
    ): OperationResponse<any>
    /**
     * allApiAuth*
     */
    'trace'(
      parameters?: Parameters<UnknownParamsObject> | null,
      data?: any,
      config?: AxiosRequestConfig  
    ): OperationResponse<any>
  }
  ['/']: {
    /**
     * getIndex
     */
    'get'(
      parameters?: Parameters<UnknownParamsObject> | null,
      data?: any,
      config?: AxiosRequestConfig  
    ): OperationResponse<any>
  }
  ['/static/*']: {
    /**
     * getStatic*
     */
    'get'(
      parameters?: Parameters<UnknownParamsObject> | null,
      data?: any,
      config?: AxiosRequestConfig  
    ): OperationResponse<any>
  }
}

export type Client = OpenAPIClient<OperationMethods, PathsDictionary>



