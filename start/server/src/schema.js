const {gql} = require('apollo-server');

const typeDefs = gql`
#The schema shall go here

#The rocket
type Rocket {
    id: ID!
    name: String
    type: String
}

#The user
type User {
    id: ID!
    email: String!
    trips: [Launch]!
    token:String
}

#Mission
type Mission {
    name:String
    missionPatch(size:PatchSize): String
}

#PatchSize
enum PatchSize {
    SMALL
    LARGE
}

#TripUpdateResponse
type TripUpdateResponse {
    success: Boolean!
    message: String
    launches: [Launch]
}

type Launch {
    id: ID!
    site: String
    mission: Mission
    rocket: Rocket
    isBooked: Boolean!
}

type LaunchConnection {
    cursor:String!
    hasMore:Boolean!
    launches:[Launch]!
}

type Query {
    launches(pageSize:Int,after:String):LaunchConnection
    launch(id:ID!):Launch
    me:User
}

type Mutation {
    bookTrips(launchIds:[ID]!): TripUpdateResponse!
    cancelTrip(launchId:ID!): TripUpdateResponse!
    login(email: String): User
}
`;

module.exports = typeDefs;