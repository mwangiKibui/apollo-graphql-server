
const {paginateResults} = require('./utils');

// with the dataSources passed when creating the server,
// we can access it on the third argument of the resolver
// that is context.

//when you dont intend to use an argument
//you can use an underscore.

// you keep on incrementing 
// from _ the first, the second will be __ and so on.

module.exports = {
    Query:{
        launches:async (_,{pageSize = 20,after},{dataSources}) => {

            const allLaunches = await dataSources.launchAPI.getAllLaunches();

            //we want these in reverse order.
            allLaunches.reverse();

            const launches = paginateResults({
                after,
                pageSize,
                results:allLaunches
            });

            return {
                launches,
                cursor:launches.length ? launches[launches.length - 1 ]['cursor'] : null,
                // if the cursor is at the end of paginated results
                // it is the same as the last item in all results 
                // hence no more results after this.
                hasMore: launches.length 
                ? launches[launches.length - 1].cursor !== 
                allLaunches[allLaunches.length - 1].cursor
                : false
            }
        },
        launch:(_,{id},{dataSources}) => dataSources.launchAPI.getLaunchById( {launchId:id} ),
        me:(_,__,{dataSources}) => dataSources.userAPI.findOrCreateUser()
    },
    Mutation:{
        login:async(_,{email},{dataSources}) => {
            const user = await dataSources.userAPI.findOrCreateUser({email});
            if(user){
                user.token = new  Buffer.from(email).toString('base64');
                return user;
            }
        },
        bookTrips:async (_,{launchIds},{dataSources}) => {
            const results = await dataSources.userAPI.bookTrips({launchIds});

            const launches = await dataSources.launchAPI.getLaunchesByIds({
                launchIds
            });

            return {

                success:results && results.length === launches.length,
                message:
                results.length === launchIds.length ? 
                'Trips booked successfully' : `
                The following launches could not be booked ${
                    launchIds.filter(id => !results.includes(id))
                }
                `,
                launches
            }
        },
        cancelTrip:async (_,{launchId},{dataSources}) => {
            const result = await dataSources.userAPI.cancelTrip({launchId});

            if(!result){
                return {
                    success:false,
                    message:'Failed to cancel trip'
                }
            };

            const launch = await dataSources.launchAPI.getLaunchById({launchId});

            return {
                success:true,
                message:'trip cancelled',
                launches:[launch]
            }
        }
    },
    Mission:{
        //mission is the parent.
        //The default size is large is not specified.
        missionPatch:(mission,{size} = {size:'LARGE'}) => {
            return size === "SMALL"
            ? mission.missionPatchSmall
            : mission.missionPatchLarge
        }
    },
    Launch: {
        //launch is the parent.
        isBooked:async (launch,_,{dataSources}) => dataSources.userAPI.isBookedOnLaunch({
            launchId:launch.id
        })
    },
    User:{
        trips: async (_,__,{dataSources}) => {
            //get ids of launches by user.
            const launchIds = await dataSources.userAPI.getLaunchIdsByUser();

            if(!launchIds.length) return [];
            
            //else we lookup for those launches by their ids.
            return (
                dataSources.launchAPI.getLaunchesByIds({
                    launchIds,
                }) || []
            )
        }
    }
}