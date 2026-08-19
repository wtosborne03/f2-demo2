import type {
  OpenAPIClient,
  Parameters,
  UnknownParamsObject,
  OperationResponse,
  AxiosRequestConfig,
} from 'openapi-client-axios';

declare namespace Paths {
    namespace GetGameAllPrompts {
        namespace Parameters {
            export type ExcludeGameId = string;
            export type UserIds = string;
        }
        export interface QueryParameters {
            userIds?: Parameters.UserIds;
            excludeGameId?: Parameters.ExcludeGameId;
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
    namespace GetHistoryGames {
        namespace Parameters {
            export type Limit = string;
            export type Offset = string;
        }
        export interface QueryParameters {
            limit?: Parameters.Limit;
            offset?: Parameters.Offset;
        }
    }
    namespace GetHistoryGamesById {
        namespace Parameters {
            export type Id = string;
        }
        export interface PathParameters {
            id: Parameters.Id;
        }
    }
    namespace GetKalshiMarket {
        namespace Parameters {
            /**
             * Market category name
             */
            export type Category = string;
            /**
             * Comma separated list of already used market tickers
             */
            export type Used = string;
        }
        export interface QueryParameters {
            category: /* Market category name */ Parameters.Category;
            used?: /* Comma separated list of already used market tickers */ Parameters.Used;
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
    namespace GetTts {
        namespace Parameters {
            /**
             * Text to synthesize
             */
            export type Text = string;
            export type Voice = "brian" | "jeff" | "pres" | "robot";
        }
        export interface QueryParameters {
            text: /* Text to synthesize */ Parameters.Text;
            voice: Parameters.Voice;
        }
        namespace Responses {
            /**
             * Generated WAV audio stream
             */
            export type $200 = any;
            export interface $400 {
                error: string;
            }
            export interface $500 {
                error: string;
            }
        }
    }
    namespace GetTxt2imgHealth {
        namespace Responses {
            export interface $200 {
                status: string;
            }
            export interface $503 {
                error: string;
            }
        }
    }
    namespace GetUsersByIdImages {
        namespace Parameters {
            export type GameId = string;
            export type Id = string;
            export type Limit = string;
            export type Offset = string;
        }
        export interface PathParameters {
            id: Parameters.Id;
        }
        export interface QueryParameters {
            gameId?: Parameters.GameId;
            limit?: Parameters.Limit;
            offset?: Parameters.Offset;
        }
        namespace Responses {
            export type $200 = {
                id: number;
                content: string;
                createdAt: number;
                game: number;
                minigame: number;
                minigameName?: string;
                prompt?: string;
                votes?: number;
            }[];
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
                avatar_selfie?: string | null;
                avatar_landmarks?: string | null;
                avatar_neutral_open?: string | null;
                avatar_neutral_closed?: string | null;
                avatar_happy_open?: string | null;
                avatar_happy_closed?: string | null;
                avatar_sad_open?: string | null;
                avatar_sad_closed?: string | null;
                avatar_surprised_open?: string | null;
                avatar_surprised_closed?: string | null;
                avatar_gender?: string | null;
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
    namespace GetYoutubeBeatsByVideoId {
        namespace Parameters {
            export type Lanes = string /* numeric */ | number;
            export type Title = string;
            export type VideoId = string;
        }
        export interface PathParameters {
            videoId: Parameters.VideoId;
        }
        export interface QueryParameters {
            lanes?: Parameters.Lanes;
            title?: Parameters.Title;
        }
        namespace Responses {
            export type $200 = any;
            export interface $400 {
                error: string;
            }
            export interface $500 {
                error: string;
            }
        }
    }
    namespace GetYoutubeSearch {
        namespace Parameters {
            export type Q = string;
        }
        export interface QueryParameters {
            q: Parameters.Q;
        }
    }
    namespace GetYoutubeTranscript {
        namespace Parameters {
            export type VideoId = string;
        }
        export interface QueryParameters {
            videoId: Parameters.VideoId;
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
                name?: string;
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
    namespace PostTxt2imgImg2img {
        export interface RequestBody {
            init_images: string[];
            prompt: string;
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
    namespace PostTxt2imgSelfiegenerate {
        export interface RequestBody {
            selfie_url: string;
            prompt: string;
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
    namespace PostUpload {
        namespace Parameters {
            export type DetectLandmarks = string;
            export type GenerateExpressions = string;
        }
        export interface QueryParameters {
            detect_landmarks?: Parameters.DetectLandmarks;
            generate_expressions?: Parameters.GenerateExpressions;
        }
        export interface RequestBody {
            file: string; // binary
        }
        namespace Responses {
            export interface $200 {
                url: string;
                expressions: {
                    neutral_open: string;
                    neutral_closed: string;
                    happy_open: string;
                    happy_closed: string;
                    sad_open: string;
                    sad_closed: string;
                    surprised_open: string;
                    surprised_closed: string;
                } | null | null;
                gender: string | null | null;
            }
            export interface $400 {
                error: string;
            }
            export interface $422 {
                error: string;
            }
            export interface $500 {
                error: string;
            }
        }
    }
    namespace PostUploadBase64 {
        export interface RequestBody {
            base64: string;
        }
        namespace Responses {
            export interface $200 {
                url: string;
            }
            export interface $500 {
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
            avatar_selfie?: string | null;
            avatar_landmarks?: string | null;
            avatar_neutral_open?: string | null;
            avatar_neutral_closed?: string | null;
            avatar_happy_open?: string | null;
            avatar_happy_closed?: string | null;
            avatar_sad_open?: string | null;
            avatar_sad_closed?: string | null;
            avatar_surprised_open?: string | null;
            avatar_surprised_closed?: string | null;
            avatar_gender?: string | null;
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
                avatar_selfie?: string | null;
                avatar_landmarks?: string | null;
                avatar_neutral_open?: string | null;
                avatar_neutral_closed?: string | null;
                avatar_happy_open?: string | null;
                avatar_happy_closed?: string | null;
                avatar_sad_open?: string | null;
                avatar_sad_closed?: string | null;
                avatar_surprised_open?: string | null;
                avatar_surprised_closed?: string | null;
                avatar_gender?: string | null;
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
   * getUsersByIdImages - Get all images for a user, optionally filtered by game
   */
  'getUsersByIdImages'(
    parameters?: Parameters<Paths.GetUsersByIdImages.QueryParameters & Paths.GetUsersByIdImages.PathParameters> | null,
    data?: any,
    config?: AxiosRequestConfig  
  ): OperationResponse<Paths.GetUsersByIdImages.Responses.$200>
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
   * getGameAll-prompts - Get all prompts across all games
   */
  'getGameAll-prompts'(
    parameters?: Parameters<Paths.GetGameAllPrompts.QueryParameters> | null,
    data?: any,
    config?: AxiosRequestConfig  
  ): OperationResponse<Paths.GetGameAllPrompts.Responses.$200>
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
   * postTxt2imgImg2img - Generate image using Stable Diffusion img2img API
   */
  'postTxt2imgImg2img'(
    parameters?: Parameters<UnknownParamsObject> | null,
    data?: Paths.PostTxt2imgImg2img.RequestBody,
    config?: AxiosRequestConfig  
  ): OperationResponse<Paths.PostTxt2imgImg2img.Responses.$200>
  /**
   * postTxt2imgSelfiegenerate - Generate selfie/moodboard images using the new /generate API
   */
  'postTxt2imgSelfiegenerate'(
    parameters?: Parameters<UnknownParamsObject> | null,
    data?: Paths.PostTxt2imgSelfiegenerate.RequestBody,
    config?: AxiosRequestConfig  
  ): OperationResponse<Paths.PostTxt2imgSelfiegenerate.Responses.$200>
  /**
   * getTxt2imgHealth - Check the health of the Stable Diffusion API connection
   */
  'getTxt2imgHealth'(
    parameters?: Parameters<UnknownParamsObject> | null,
    data?: any,
    config?: AxiosRequestConfig  
  ): OperationResponse<Paths.GetTxt2imgHealth.Responses.$200>
  /**
   * postUpload
   */
  'postUpload'(
    parameters?: Parameters<Paths.PostUpload.QueryParameters> | null,
    data?: Paths.PostUpload.RequestBody,
    config?: AxiosRequestConfig  
  ): OperationResponse<Paths.PostUpload.Responses.$200>
  /**
   * postUploadBase64
   */
  'postUploadBase64'(
    parameters?: Parameters<UnknownParamsObject> | null,
    data?: Paths.PostUploadBase64.RequestBody,
    config?: AxiosRequestConfig  
  ): OperationResponse<Paths.PostUploadBase64.Responses.$200>
  /**
   * getTts - Synthesize text to speech stream using pocket-tts
   */
  'getTts'(
    parameters?: Parameters<Paths.GetTts.QueryParameters> | null,
    data?: any,
    config?: AxiosRequestConfig  
  ): OperationResponse<Paths.GetTts.Responses.$200>
  /**
   * getKalshiMarket - Get prediction market for category with server caching
   */
  'getKalshiMarket'(
    parameters?: Parameters<Paths.GetKalshiMarket.QueryParameters> | null,
    data?: any,
    config?: AxiosRequestConfig  
  ): OperationResponse<any>
  /**
   * getYoutubeBeatsByVideoId
   */
  'getYoutubeBeatsByVideoId'(
    parameters?: Parameters<Paths.GetYoutubeBeatsByVideoId.QueryParameters & Paths.GetYoutubeBeatsByVideoId.PathParameters> | null,
    data?: any,
    config?: AxiosRequestConfig  
  ): OperationResponse<Paths.GetYoutubeBeatsByVideoId.Responses.$200>
  /**
   * getYoutubeSearch
   */
  'getYoutubeSearch'(
    parameters?: Parameters<Paths.GetYoutubeSearch.QueryParameters> | null,
    data?: any,
    config?: AxiosRequestConfig  
  ): OperationResponse<any>
  /**
   * getYoutubeTranscript
   */
  'getYoutubeTranscript'(
    parameters?: Parameters<Paths.GetYoutubeTranscript.QueryParameters> | null,
    data?: any,
    config?: AxiosRequestConfig  
  ): OperationResponse<any>
  /**
   * getHistoryGames - Get all games with player roster and stats summary
   */
  'getHistoryGames'(
    parameters?: Parameters<Paths.GetHistoryGames.QueryParameters> | null,
    data?: any,
    config?: AxiosRequestConfig  
  ): OperationResponse<any>
  /**
   * getHistoryGamesById - Get detailed information, player roster, and prompt submissions for a specific game
   */
  'getHistoryGamesById'(
    parameters?: Parameters<Paths.GetHistoryGamesById.PathParameters> | null,
    data?: any,
    config?: AxiosRequestConfig  
  ): OperationResponse<any>
  /**
   * getHistoryStats - Get global game history statistics and leaderboards
   */
  'getHistoryStats'(
    parameters?: Parameters<UnknownParamsObject> | null,
    data?: any,
    config?: AxiosRequestConfig  
  ): OperationResponse<any>
  /**
   * getHistory
   */
  'getHistory'(
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
   * getStaticHistory
   */
  'getStaticHistory'(
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
  ['/users/{id}/images']: {
    /**
     * getUsersByIdImages - Get all images for a user, optionally filtered by game
     */
    'get'(
      parameters?: Parameters<Paths.GetUsersByIdImages.QueryParameters & Paths.GetUsersByIdImages.PathParameters> | null,
      data?: any,
      config?: AxiosRequestConfig  
    ): OperationResponse<Paths.GetUsersByIdImages.Responses.$200>
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
  ['/game/all-prompts']: {
    /**
     * getGameAll-prompts - Get all prompts across all games
     */
    'get'(
      parameters?: Parameters<Paths.GetGameAllPrompts.QueryParameters> | null,
      data?: any,
      config?: AxiosRequestConfig  
    ): OperationResponse<Paths.GetGameAllPrompts.Responses.$200>
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
  ['/txt2img/img2img']: {
    /**
     * postTxt2imgImg2img - Generate image using Stable Diffusion img2img API
     */
    'post'(
      parameters?: Parameters<UnknownParamsObject> | null,
      data?: Paths.PostTxt2imgImg2img.RequestBody,
      config?: AxiosRequestConfig  
    ): OperationResponse<Paths.PostTxt2imgImg2img.Responses.$200>
  }
  ['/txt2img/selfiegenerate']: {
    /**
     * postTxt2imgSelfiegenerate - Generate selfie/moodboard images using the new /generate API
     */
    'post'(
      parameters?: Parameters<UnknownParamsObject> | null,
      data?: Paths.PostTxt2imgSelfiegenerate.RequestBody,
      config?: AxiosRequestConfig  
    ): OperationResponse<Paths.PostTxt2imgSelfiegenerate.Responses.$200>
  }
  ['/txt2img/health']: {
    /**
     * getTxt2imgHealth - Check the health of the Stable Diffusion API connection
     */
    'get'(
      parameters?: Parameters<UnknownParamsObject> | null,
      data?: any,
      config?: AxiosRequestConfig  
    ): OperationResponse<Paths.GetTxt2imgHealth.Responses.$200>
  }
  ['/upload/']: {
    /**
     * postUpload
     */
    'post'(
      parameters?: Parameters<Paths.PostUpload.QueryParameters> | null,
      data?: Paths.PostUpload.RequestBody,
      config?: AxiosRequestConfig  
    ): OperationResponse<Paths.PostUpload.Responses.$200>
  }
  ['/upload/base64']: {
    /**
     * postUploadBase64
     */
    'post'(
      parameters?: Parameters<UnknownParamsObject> | null,
      data?: Paths.PostUploadBase64.RequestBody,
      config?: AxiosRequestConfig  
    ): OperationResponse<Paths.PostUploadBase64.Responses.$200>
  }
  ['/tts']: {
    /**
     * getTts - Synthesize text to speech stream using pocket-tts
     */
    'get'(
      parameters?: Parameters<Paths.GetTts.QueryParameters> | null,
      data?: any,
      config?: AxiosRequestConfig  
    ): OperationResponse<Paths.GetTts.Responses.$200>
  }
  ['/kalshi/market']: {
    /**
     * getKalshiMarket - Get prediction market for category with server caching
     */
    'get'(
      parameters?: Parameters<Paths.GetKalshiMarket.QueryParameters> | null,
      data?: any,
      config?: AxiosRequestConfig  
    ): OperationResponse<any>
  }
  ['/youtube/beats/{videoId}']: {
    /**
     * getYoutubeBeatsByVideoId
     */
    'get'(
      parameters?: Parameters<Paths.GetYoutubeBeatsByVideoId.QueryParameters & Paths.GetYoutubeBeatsByVideoId.PathParameters> | null,
      data?: any,
      config?: AxiosRequestConfig  
    ): OperationResponse<Paths.GetYoutubeBeatsByVideoId.Responses.$200>
  }
  ['/youtube/search']: {
    /**
     * getYoutubeSearch
     */
    'get'(
      parameters?: Parameters<Paths.GetYoutubeSearch.QueryParameters> | null,
      data?: any,
      config?: AxiosRequestConfig  
    ): OperationResponse<any>
  }
  ['/youtube/transcript']: {
    /**
     * getYoutubeTranscript
     */
    'get'(
      parameters?: Parameters<Paths.GetYoutubeTranscript.QueryParameters> | null,
      data?: any,
      config?: AxiosRequestConfig  
    ): OperationResponse<any>
  }
  ['/history/games']: {
    /**
     * getHistoryGames - Get all games with player roster and stats summary
     */
    'get'(
      parameters?: Parameters<Paths.GetHistoryGames.QueryParameters> | null,
      data?: any,
      config?: AxiosRequestConfig  
    ): OperationResponse<any>
  }
  ['/history/games/{id}']: {
    /**
     * getHistoryGamesById - Get detailed information, player roster, and prompt submissions for a specific game
     */
    'get'(
      parameters?: Parameters<Paths.GetHistoryGamesById.PathParameters> | null,
      data?: any,
      config?: AxiosRequestConfig  
    ): OperationResponse<any>
  }
  ['/history/stats']: {
    /**
     * getHistoryStats - Get global game history statistics and leaderboards
     */
    'get'(
      parameters?: Parameters<UnknownParamsObject> | null,
      data?: any,
      config?: AxiosRequestConfig  
    ): OperationResponse<any>
  }
  ['/history']: {
    /**
     * getHistory
     */
    'get'(
      parameters?: Parameters<UnknownParamsObject> | null,
      data?: any,
      config?: AxiosRequestConfig  
    ): OperationResponse<any>
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
  ['/static/history']: {
    /**
     * getStaticHistory
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



