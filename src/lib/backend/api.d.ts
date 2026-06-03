import type {
  OpenAPIClient,
  Parameters,
  UnknownParamsObject,
  OperationResponse,
  AxiosRequestConfig,
} from 'openapi-client-axios';

declare namespace Paths {
    namespace GetGameByIdPrompts {
        namespace Parameters {
            export type Id = string;
            export type Type = number;
        }
        export interface PathParameters {
            id: Parameters.Id;
        }
        export interface QueryParameters {
            type?: Parameters.Type;
        }
        namespace Responses {
            export type $200 = {
                id: number;
                content: string;
                createdAt: number;
                game: number;
                minigame: number;
                prompt?: string;
                type: number;
                user?: string;
                votes?: number;
                userId?: string;
                gameName?: string;
            }[];
        }
    }
    namespace GetGameTime {
        namespace Responses {
            export interface $200 {
                time: number;
            }
        }
    }
    namespace GetMapIplocation {
        namespace Parameters {
            export type Ip = string;
        }
        export interface QueryParameters {
            ip: Parameters.Ip;
        }
        namespace Responses {
            export interface $200 {
                longitude: number;
                latitude: number;
                country: string;
                region: string;
                city: string;
            }
            export interface $404 {
                error: string;
            }
        }
    }
    namespace GetMapPlaces {
        namespace Parameters {
            export type Latitude = string /* numeric */ | number;
            export type Limit = string /* numeric */ | number;
            export type Longitude = string /* numeric */ | number;
            export type Radius = string /* numeric */ | number;
        }
        export interface QueryParameters {
            latitude: Parameters.Latitude;
            longitude: Parameters.Longitude;
            radius?: Parameters.Radius;
            limit?: Parameters.Limit;
        }
        namespace Responses {
            export type $200 = {
                id: string;
                name: string;
                latitude: number;
                longitude: number;
                categories: {
                    id: string;
                    name: string;
                    icon?: string;
                }[];
                photos: {
                    id: string;
                    url: string;
                    width: number;
                    height: number;
                }[];
                location: {
                    formatted_address?: string;
                };
            }[];
            export interface $500 {
                error: string;
            }
        }
    }
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
                salePrice?: number;
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
                salePrice?: number;
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
                avatar_selfie?: string | null;
                avatar_landmarks?: string | null;
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
    namespace PostGameByIdPrompt {
        namespace Parameters {
            export type Id = string;
        }
        export interface PathParameters {
            id: Parameters.Id;
        }
        export interface RequestBody {
            content: string;
            type: number;
            minigameId: number;
            userId?: string;
            prompt?: string;
            votes?: number;
        }
        namespace Responses {
            export interface $200 {
                success: boolean;
            }
            export interface $500 {
                error: string;
            }
        }
    }
    namespace PostGameByIdStats {
        namespace Parameters {
            export type Id = string;
        }
        export interface PathParameters {
            id: Parameters.Id;
        }
        export interface RequestBody {
            players: {
                userId: string;
                score: number;
                drinks: number;
                name: string;
            }[];
            winningPlayers: string[];
        }
        namespace Responses {
            export interface $200 {
                success: boolean;
            }
            export interface $404 {
                error: string;
            }
        }
    }
    namespace PostGameStart {
        export interface RequestBody {
            players: {
                userId?: string;
            }[];
        }
        namespace Responses {
            export interface $200 {
                gameId: number;
            }
            export interface $500 {
                error: string;
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
    namespace PostTxt2img {
        export interface RequestBody {
            prompt: string;
            negative_prompt?: string;
            steps?: number;
            cfg_scale?: number;
            width?: number;
            height?: number;
            seed?: number;
            sampler_name?: string;
            batch_size?: number;
        }
        namespace Responses {
            export interface $200 {
                images: string[];
                parameters?: any;
                info?: string;
            }
            export interface $500 {
                error: string;
            }
            export interface $503 {
                error: string;
            }
        }
    }
    namespace PutGameByIdRounds {
        namespace Parameters {
            export type Id = string;
        }
        export interface PathParameters {
            id: Parameters.Id;
        }
        export interface RequestBody {
            rounds: number;
        }
        namespace Responses {
            export interface $200 {
                success: boolean;
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
            avatar_selfie?: string | null;
            avatar_landmarks?: string | null;
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
                avatar_selfie?: string | null;
                avatar_landmarks?: string | null;
                dollars: number;
                game_name?: string | null;
            }
            export interface $404 {
                message: string;
            }
        }
    }
    namespace PutUsersName {
        export interface RequestBody {
            name: string;
        }
        namespace Responses {
            export interface $200 {
                success: boolean;
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
   * putUsersName - Update user name
   */
  'putUsersName'(
    parameters?: Parameters<UnknownParamsObject> | null,
    data?: Paths.PutUsersName.RequestBody,
    config?: AxiosRequestConfig  
  ): OperationResponse<Paths.PutUsersName.Responses.$200>
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
   * getGameTime - Get server time
   */
  'getGameTime'(
    parameters?: Parameters<UnknownParamsObject> | null,
    data?: any,
    config?: AxiosRequestConfig  
  ): OperationResponse<Paths.GetGameTime.Responses.$200>
  /**
   * postGameStart - Start a new game
   */
  'postGameStart'(
    parameters?: Parameters<UnknownParamsObject> | null,
    data?: Paths.PostGameStart.RequestBody,
    config?: AxiosRequestConfig  
  ): OperationResponse<Paths.PostGameStart.Responses.$200>
  /**
   * putGameByIdRounds - Update game rounds
   */
  'putGameByIdRounds'(
    parameters?: Parameters<Paths.PutGameByIdRounds.PathParameters> | null,
    data?: Paths.PutGameByIdRounds.RequestBody,
    config?: AxiosRequestConfig  
  ): OperationResponse<Paths.PutGameByIdRounds.Responses.$200>
  /**
   * getGameByIdPrompts - Get previous prompts for a game
   */
  'getGameByIdPrompts'(
    parameters?: Parameters<Paths.GetGameByIdPrompts.QueryParameters & Paths.GetGameByIdPrompts.PathParameters> | null,
    data?: any,
    config?: AxiosRequestConfig  
  ): OperationResponse<Paths.GetGameByIdPrompts.Responses.$200>
  /**
   * postGameByIdStats - Upload game stats
   */
  'postGameByIdStats'(
    parameters?: Parameters<Paths.PostGameByIdStats.PathParameters> | null,
    data?: Paths.PostGameByIdStats.RequestBody,
    config?: AxiosRequestConfig  
  ): OperationResponse<Paths.PostGameByIdStats.Responses.$200>
  /**
   * postGameByIdPrompt - Upload a prompt
   */
  'postGameByIdPrompt'(
    parameters?: Parameters<Paths.PostGameByIdPrompt.PathParameters> | null,
    data?: Paths.PostGameByIdPrompt.RequestBody,
    config?: AxiosRequestConfig  
  ): OperationResponse<Paths.PostGameByIdPrompt.Responses.$200>
  /**
   * getMapIplocation - Get location based on IP address
   */
  'getMapIplocation'(
    parameters?: Parameters<Paths.GetMapIplocation.QueryParameters> | null,
    data?: any,
    config?: AxiosRequestConfig  
  ): OperationResponse<Paths.GetMapIplocation.Responses.$200>
  /**
   * getMapPlaces - Search for places using Overpass API (OpenStreetMap)
   */
  'getMapPlaces'(
    parameters?: Parameters<Paths.GetMapPlaces.QueryParameters> | null,
    data?: any,
    config?: AxiosRequestConfig  
  ): OperationResponse<Paths.GetMapPlaces.Responses.$200>
  /**
   * postTxt2img - Generate image using Stable Diffusion txt2img API
   */
  'postTxt2img'(
    parameters?: Parameters<UnknownParamsObject> | null,
    data?: Paths.PostTxt2img.RequestBody,
    config?: AxiosRequestConfig  
  ): OperationResponse<Paths.PostTxt2img.Responses.$200>
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
  ['/game/host']: {
  }
  ['/game/play']: {
  }
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
  ['/users/name']: {
    /**
     * putUsersName - Update user name
     */
    'put'(
      parameters?: Parameters<UnknownParamsObject> | null,
      data?: Paths.PutUsersName.RequestBody,
      config?: AxiosRequestConfig  
    ): OperationResponse<Paths.PutUsersName.Responses.$200>
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
  ['/game/time']: {
    /**
     * getGameTime - Get server time
     */
    'get'(
      parameters?: Parameters<UnknownParamsObject> | null,
      data?: any,
      config?: AxiosRequestConfig  
    ): OperationResponse<Paths.GetGameTime.Responses.$200>
  }
  ['/game/start']: {
    /**
     * postGameStart - Start a new game
     */
    'post'(
      parameters?: Parameters<UnknownParamsObject> | null,
      data?: Paths.PostGameStart.RequestBody,
      config?: AxiosRequestConfig  
    ): OperationResponse<Paths.PostGameStart.Responses.$200>
  }
  ['/game/{id}/rounds']: {
    /**
     * putGameByIdRounds - Update game rounds
     */
    'put'(
      parameters?: Parameters<Paths.PutGameByIdRounds.PathParameters> | null,
      data?: Paths.PutGameByIdRounds.RequestBody,
      config?: AxiosRequestConfig  
    ): OperationResponse<Paths.PutGameByIdRounds.Responses.$200>
  }
  ['/game/{id}/prompts']: {
    /**
     * getGameByIdPrompts - Get previous prompts for a game
     */
    'get'(
      parameters?: Parameters<Paths.GetGameByIdPrompts.QueryParameters & Paths.GetGameByIdPrompts.PathParameters> | null,
      data?: any,
      config?: AxiosRequestConfig  
    ): OperationResponse<Paths.GetGameByIdPrompts.Responses.$200>
  }
  ['/game/{id}/stats']: {
    /**
     * postGameByIdStats - Upload game stats
     */
    'post'(
      parameters?: Parameters<Paths.PostGameByIdStats.PathParameters> | null,
      data?: Paths.PostGameByIdStats.RequestBody,
      config?: AxiosRequestConfig  
    ): OperationResponse<Paths.PostGameByIdStats.Responses.$200>
  }
  ['/game/{id}/prompt']: {
    /**
     * postGameByIdPrompt - Upload a prompt
     */
    'post'(
      parameters?: Parameters<Paths.PostGameByIdPrompt.PathParameters> | null,
      data?: Paths.PostGameByIdPrompt.RequestBody,
      config?: AxiosRequestConfig  
    ): OperationResponse<Paths.PostGameByIdPrompt.Responses.$200>
  }
  ['/map/iplocation']: {
    /**
     * getMapIplocation - Get location based on IP address
     */
    'get'(
      parameters?: Parameters<Paths.GetMapIplocation.QueryParameters> | null,
      data?: any,
      config?: AxiosRequestConfig  
    ): OperationResponse<Paths.GetMapIplocation.Responses.$200>
  }
  ['/map/places']: {
    /**
     * getMapPlaces - Search for places using Overpass API (OpenStreetMap)
     */
    'get'(
      parameters?: Parameters<Paths.GetMapPlaces.QueryParameters> | null,
      data?: any,
      config?: AxiosRequestConfig  
    ): OperationResponse<Paths.GetMapPlaces.Responses.$200>
  }
  ['/txt2img/']: {
    /**
     * postTxt2img - Generate image using Stable Diffusion txt2img API
     */
    'post'(
      parameters?: Parameters<UnknownParamsObject> | null,
      data?: Paths.PostTxt2img.RequestBody,
      config?: AxiosRequestConfig  
    ): OperationResponse<Paths.PostTxt2img.Responses.$200>
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



