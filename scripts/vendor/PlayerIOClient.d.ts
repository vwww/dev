// Partial declaration of PlayerIO library

// .d.ts code by Victor
// .js code by Player.IO
//  v3.9.0
//  released 2022-02-15
//  PlayerIO SDK.s2fG8FIPhRjoY9VN8wEadg.zip
//  MIT license without required attribution

declare namespace PIO {
  type MessageEntry = number | string | boolean | ByteArray
  type ByteArray = ArrayLike<number> // each element must be uint8

  /** Main class for authenticating a user and getting a client. */
  interface PlayerIO {
    /** Access the QuickConnect service */
    quickConnect: quickConnect

    /** If set to true, all API Requests will be encrypted using TLS/SSL. Be aware that this will cause a performance degradation by introducting secure connection negotiation latency for all requests. */
    useSecureApiRequests: boolean

    /**
     * Authenticates a user to Player.IO. See the Authentication documentation on which authenticationArguments that are needed for each authentication provider.
     * @param gameId The game id of the game you wish to connect to. This value can be found in the admin panel.
     * @param connectionId The id of the connection, as given in the settings section of the admin panel. 'public' should be used as the default
     * @param authenticationArguments A dictionary of arguments for the given connection.
     * @param playerInsightSegments Custom segments for the user in PlayerInsight.
     * @param successCallback Callback function that will be called with a client when succesfully connected
     * @param errorCallback Callback function that will be called if an error occurs
     */
    authenticate (
      gameId: string,
      connectionId: string,
      authenticationArguments: object,
      playerInsightSegments: object,
      successCallback: (client: client) => void,
      errorCallback: (error: PlayerIOError) => void,
    ): void

    /**
     * Get a gameFS instance for a specific game (only use this method when you don't have a valid client).
     * @param gameId The game id of the game you wish to access.
     */
    gameFS (gameId: string): gameFS
  }

  interface achievement {}
  interface achievements {}
  interface bigDB {}

  /** An instance of this class is returned after successfully authenticating a user to PlayerIO. It contains the id of the current user, and methods for making all API calls on behalf of that user. */
  interface client {
    /** The Achievements service */
    achievements: achievements

    /** The BigDB service */
    bigDB: bigDB

    /** User id of the currently connected user */
    connectUserId: string

    /** The ErrorLog service */
    errorLog: errorLog

    /** The GameFS service */
    gameFS: gameFS

    /** The game id of the client */
    gameId: string

    /** The GameRequests service */
    gameRequests: gameRequests

    /** The Multiplayer service */
    multiplayer: multiplayer

    /** The Notifications service */
    notifications: notifications

    /** The OneScore service */
    oneScore: oneScore

    /** The PayVault service */
    payVault: payVault

    /** The PlayerInsight service */
    playerInsight: playerInsight

    /** The PlayerIO Publishing Network service */
    publishingNetwork: publishingNetwork
  }

  /** An instance of this class is returned after successfully joining a Multiplayer room. It encapsulates the active network connection between the user and the room, and has methods for sending and handling messages, as well as disconnecting fom the room. See the Multiplayer class for examples. */
  interface connection {
    /** Indicates if the connection is still alive */
    connected: boolean

    /**
     * Add a disconnect callback that will be called when the connection is disconnected
     * @param callback The callback to be called when a disconnect happens
     */
    addDisconnectCallback (callback: () => void): void

    /**
     * Add a message callback for the given message type.
     * @param type The type of message to invoke the callback for. Use '*' to handle all message types.
     * @param callback The callback to be called when a message of the given type is received
     */
    addMessageCallback (type: string, callback: (message: message) => void): void

    /**
     * Create a message with arguments inline: connection.createMessage('invite', arg1, arg2...)
     * @param type The string type to give to the message.
     */
    createMessage (type: string): message

    /** Disconnect from the multiplayer room */
    disconnect (): void

    /**
     * Remove an already registered disconnect callback
     * @param callback The callback to remove
     */
    removeDisconnectCallback (callback: () => void): void

    /**
     * Remove an already registered message callback
     * @param callback The callback to remove
     */
    removeMessageCallback (callback: (message: message) => void): void

    /**
     * Send a message with arguments inline: connection.createMessage('invite', arg1, arg2...)
     * @param type The string type to give to the message.
     * @param arguments The arguments in the message.
     */
    send (type: string, ...arguments: MessageEntry[]): void

    /**
     * Send a message
     * @param message The message to send.
     */
    sendMessage (message: message): void
  }

  interface databaseobject {}
  interface errorLog {}
  interface gameFS {}
  interface gameRequest {}
  interface gameRequests {}

  interface message {
    /** The number of entries in this message */
    length: number

    /** The type of the message */
    type: string

    /**
     * Adds data entries to the Message object
     * @param arguments Entries to add. Valid types are Number, String, Boolean and ByteArray. If a Number is passed, and it is an integer, it will be added to the first type it fits in this order: Int, UInt, Long, ULong. If it doesn't fit in any integer type, or if it's not an integer, it will be added as a Double.
     */
    add (...arguments: MessageEntry[]): void

    /**
     * Add a boolean value to the message
     * @param value The bool to add
     */
    addBoolean (value: boolean): void

    /**
     * Add a byte array value to the message
     * @param value The byte array to add
     */
    addByteArray (value: ByteArray): void

    /**
     * Add a value encoded as a double to the message
     * @param value The number to add
     */
    addDouble (value: number): void

    /**
     * Add a value encoded as a float to the message
     * @param value
     */
    addFloat (value: number): void

    /**
     * Add a value encoded as an int to the message
     * @param value The number to add
     */
    addInt (value: number): void

    /**
     * Add a value encoded as a long to the message
     * @param value The number to add
     */
    addLong (value: number): void

    /**
     * Add a string value to the message
     * @param value Add a string value to the message
     */
    addString (value: string): void

    /**
     * Add a value encoded as a uint to the message
     * @param value The number to add
     */
    addUInt (value: number): void

    /**
     * Add a value encoded as a ulong to the message
     * @param value The number to add
     */
    addULong (value: number): void

    /**
     * Get the bool from the message at the given index
     * @param index The zero-based index of the entry to get
     */
    getBoolean (index: number): boolean

    /**
     * Get the int from the message at the given index
     * @param index The zero-based index of the entry to get
     */
    getByteArray (index: number): ByteArray

    /**
     * Get the double from the message at the given index
     * @param index The zero-based index of the entry to get
     */
    getDouble (index: number): number

    /**
     * Get the float from the message at the given index
     * @param index The zero-based index of the entry to get
     */
    getFloat (index: number): number

    /**
     * Get the int from the message at the given index
     * @param index The zero-based index of the entry to get
     */
    getInt (index: number): number

    /**
     * Get the long from the message at the given index
     * @param index The zero-based index of the entry to get
     */
    getLong (index: number): number

    /**
     * Get the string from the message at the given index
     * @param index The zero-based index of the entry to get
     */
    getString (index: number): string

    /**
     * Get the uint from the message at the given index
     * @param index The zero-based index of the entry to get
     */
    getUInt (index: number): number

    /**
     * Get the ulong from the message at the given index
     * @param index The zero-based index of the entry to get
     */
    getULong (index: number): number

    /** Get a string representation of the message */
    toString (): string
  }

  interface multiplayer {
    /** If not null, rooms will be created on the development server at the address defined by the server endpoint, instead of using the live multiplayer servers. */
    developmentServer: string | null

    /** If set to true, the multiplayer connections will be encrypted using TLS/SSL. Be aware that this will cause a performance degradation by introducting secure connection negotiation latency when connecting. */
    useSecureConnections: boolean

    /**
     * Creates a multiplayer room (if it does not exist already) and joins it.
     * @param roomId The id of the room you wish to create/join.
     * @param roomType The name of the room type you wish to run the room as. This value should match one of the [RoomType(...)] attributes of your uploaded code. A room type of 'bounce' is always available.
     * @param visible If the room doesn't exist: Should the room be visible when listing rooms with GetRooms upon creation?
     * @param roomData If the room doesn't exist: The data to initialize the room with upon creation.
     * @param joinData Data to send to the room with additional information about the join.
     * @param successCallback Callback function that will be called with a connection to the room
     * @param errorCallback Callback function that will be called if an error occurs
     */
    createJoinRoom (
      roomId: string,
      roomType: string,
      visible: boolean,
      roomData: object | null,
      joinData: object | null,
      successCallback: (connection: connection) => void,
      errorCallback: (error: PlayerIOError) => void,
    ): void

    /**
     * Create a multiplayer room on the Player.IO infrastructure.
     * @param roomId The id you wish to assign to your new room - You can use this to connect to the specific room later as long as it still exists.
     * @param roomType The name of the room type you wish to run the room as. This value should match one of the [RoomType(...)] attributes of your uploaded code. A room type of 'bounce' is always available.
     * @param visible Should the room be visible when listing rooms with GetRooms or not?
     * @param roomData The data to initialize the room with, this can be read with ListRooms and changed from the serverside.
     * @param successCallback Callback function that will be called with the newly created room id
     * @param errorCallback Callback function that will be called if an error occurs
     */
    createRoom (
      roomId: string,
      roomType: string,
      visible: boolean,
      roomData: object | null,
      successCallback: (roomId: string) => void,
      errorCallback: (error: PlayerIOError) => void,
    ): void

    /**
     * Join a running multiplayer room.
     * @param roomId The id of the room you wish to connect to.
     * @param joinData Data to send to the room with additional information about the join.
     * @param successCallback Callback function that will be called with a connection to the room
     * @param errorCallback Callback function that will be called if an error occurs
     */
    joinRoom (
      roomId: string,
      joinData: object | null,
      successCallback: (connection: connection) => void,
      errorCallback: (error: PlayerIOError) => void,
    ): void

    /**
     * List the currently running multiplayer rooms.
     * @param roomType The type of room you wish to list.
     * @param searchCriteria Only rooms with the same values in their roomdata will be returned.
     * To use search criteria you must first define searchable properties in the Multiplayer Settings page in the Control Panel for your game.
     * @param resultLimit The maximum amount of rooms you want to receive. Use 0 for 'as many as possible'.
     * @param resultOffset The offset into the list you wish to start listing at.
     * @param successCallback Callback function that will be called with a connection to the room
     * @param errorCallback Callback function that will be called if an error occurs
     */
    listRooms (
      roomType: string,
      searchCriteria: object,
      resultLimit: number,
      resultOffset: number,
      successCallback: (roomInfo: roomInfo[]) => void,
      errorCallback: (error: PlayerIOError) => void,
    ): void
  }

  interface notificationEndpoint {}
  interface notifications {}
  interface oneScore {}
  interface oneScoreValue {}
  interface payVault {}
  interface payVaultHistoryEntry {}
  interface playerInsight {}

  /** Instances of this class are returned in all error callbacks and contain information about the error that occurred. */
  interface PlayerIOError {
    /** The PlayerIO error code for this error */
    code: PlayerIOErrorCode

    /** The error message for this error */
    message: string

    /** The stack for this error, if any. The type depends on the current browser. */
    stack: object

    /** Get a string representation of error */
    toString (): string
  }

  interface PlayerIOErrorCode {}
  interface publishingNetwork {}
  interface publishingNetworkPayments {}
  interface publishingNetworkProfile {}
  interface publishingNetworkProfiles {}
  interface publishingNetworkRelations {}
  interface quickConnect {}

  /**
   * Information about a room returned from listRooms
   */
  interface roomInfo {
    /** The id of the room */
    id: string

    /** The type of the room (corresponding to the [RoomType(...)] attribute assigned to the room) */
    roomType: string

    /** How many users are currently in the room */
    onlineUsers: number

    roomData: object
  }

  interface simpleGetCaptchaOutput {}
  interface vaultItem {}
}

declare const PlayerIO: PIO.PlayerIO
