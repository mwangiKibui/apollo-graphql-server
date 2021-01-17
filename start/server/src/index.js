require('dotenv').config();
const {ApolloServer} = require('apollo-server');

const typeDefs = require('./schema');
const resolvers = require('./resolvers');
const {createStore} = require('./utils');

const LaunchAPI = require('./datasources/launch');
const UserApi = require('./datasources/user');

const isEmail = require('isemail');

const store = createStore();

const server = new ApolloServer({
    context: async ({req}) => {

        //simple auth check to check on each request.

        const auth = req.headers && req.headers.authorization || '';
        const email = new Buffer.from(auth,'base64').toString('ascii');

        if( !isEmail.validate(email)) return { 
            user : null
        };

        //find user by their email.
        const users = await store.users.findOrCreate({where:{email}});

        const user = users && users[0] || null;

        return {
            user:{
                ...user.dataValues
            }
        }

    },
    typeDefs,
    resolvers,
    // adding dataSources connects data to our app graph
    // it shall be accessed on a resolver
    // in the context argument.
    dataSources: () => ({
        launchAPI:new LaunchAPI(),
        userAPI:new UserApi({store})
    })
});

server.listen()
.then( () => {
    console.log(`
    Server is running
    Listening on port 4000
    Explore at https://studio.apollographql.com/dev
    `)
});