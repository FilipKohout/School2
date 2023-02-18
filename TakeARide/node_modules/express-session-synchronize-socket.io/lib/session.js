const
    session = {
        http: {}
        ,tcp: {}

        ,config: {}

        /**
         * @hydrate `config` attribute
         */
        ,set( config ) {

            if( typeof config !== "object")
                return;

            Object.keys( config ).forEach( attr => (
                session.config[ attr ] = config[attr]
            ) ) ;

            return session;
        }

        /**
         * @attr `model` shema of synchronize memory store
         */
        ,_model: null
        ,get model() {
            return this._model;
        }
        ,set model(val) {
            this._model = ( typeof val === "string" ) ? val.toLocaleLowerCase().trim() : null;
        }

        /**
         * @attr `target` update attribute from synchronize
         */
        ,_target: null
        ,get target() {
            return this._target ;
        }
        ,set target(val) {

            this._target = ( typeof val === "string" ) ? val.toLocaleLowerCase().trim() : null;
        }

        /**
         * @method `normalizeSynchronize`
         * @arg {string} serverType - detect pattern server type and transform real value with static value *e.g* : `"socket.io"` output `"tcp"`
         */
        ,normalizeSynchronize: require('./normalize-synchronize')

        /**
         * @method `setWorkerSynchronize`
         * @arg {string} model
         * @arg {string} target
         * @return {boolean}
         * @description save @params in **global** attributes check value and return **state use**
         */
        ,setWorkerSynchronize( model, target ) {

            session.model = session.normalizeSynchronize( model ) ;
            session.target = session.normalizeSynchronize( target ) ;

            return !!session.model && !!session.target ;
        }

        /**
         * @return {object} data session middleware
         */
        ,done( serverType ) {

            let nameAccessSessionValues = null ;

            if(typeof  process['express-session-synchronize-socket.io']['nameAccessSessionValues'] === "object" ) {

                nameAccessSessionValues = process['express-session-synchronize-socket.io']['nameAccessSessionValues'][ serverType ] || 'val' ;
            } else {
                nameAccessSessionValues = 'val' ;
            }


            if( !this[ serverType ] ) {

                throw 'InternalError "serverType" not found middleware data not build session reject';
            }

            const memoryStoreBuilder = {

                synchronize: this.synchronize
                ,synchronizeForce: this.synchronizeForce

            } ;

            memoryStoreBuilder[ nameAccessSessionValues ] = this[ serverType ] ;

            return memoryStoreBuilder ;
        }
    } ,

    /**
     * @const {object} synchronizer
     * @method `secure`
     * @method `force`
     * @description contains synchronizer memory store functions
     */
    synchronizer = require('./synchronizer')( session )
;

session.synchronize = synchronizer.secure ;

/**
 * @warn attributes not exists in model are lost in target
 * @description brut copy data session *e.g*: `a = b`
 */
session.synchronizeForce = synchronizer.force ;


module.exports = session ;
