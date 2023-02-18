module.exports = function( session ) {

    if(
        typeof session != 'object' ||
        typeof session.http != 'object' ||
        typeof session.tcp != 'object'
    ) {
        throw new TypeError('middleware builder arg1 bust be an session object') ;
    }

    return {

        secure( {model,target} ) {

            if( !session.setWorkerSynchronize( model , target ) ) {

                throw new TypeError("synchronize session reject with argument error : <object<model:string,target:string>>");
            }

            model = session.model ;
            target = session.target ;

            Object.keys( session[model] ).forEach( attr => (
                session[ target ][ attr ] = session[model][attr]
            ) ) ;

            return session;
        }
        ,force( {model,target} ) {

            if( !session.setWorkerSynchronize( model , target ) ) {

                throw new TypeError("synchronize session reject with argument error : <object<model:string,target:string>>");
            }

            // warn: attr in target not exists in model is/are erease.s
            session[ target ] = session[ model ] ;

            return session ;
        }
    }
} ;
