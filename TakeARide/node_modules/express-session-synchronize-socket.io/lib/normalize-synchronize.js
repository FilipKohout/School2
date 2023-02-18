module.exports = function( serverType ) {

    if( typeof serverType !== 'string' ) {

        return new TypeError('arg1 serverType bust be an string') ;
    }

    if( /(udp|tcp(\/ip)?)|socket(\.io)?/i.test( serverType ) )
        return "tcp";

    if( /http(s|2)?|exp(ress)?|app/i.test( serverType ) )
        return "http";

    return serverType ;
}