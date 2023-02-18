module.exports = function(
    nameAccessSessionValues = 'val'
    , fromServerType = 'http'
) {

    if( typeof fromServerType !== 'string' ) {

        throw new TypeError('fromServerType bust be an string') ;
    }

    if(
        !process['express-session-synchronize-socket.io']['nameAccessSessionValues']
    ) {

        process['express-session-synchronize-socket.io']['nameAccessSessionValues'] = {} ;
        process['express-session-synchronize-socket.io']['nameAccessSessionValues'][ fromServerType ] = nameAccessSessionValues
    }

    else if( !process['express-session-synchronize-socket.io']['nameAccessSessionValues'][ fromServerType ] ) {

        process['express-session-synchronize-socket.io']['nameAccessSessionValues'][ fromServerType ] = nameAccessSessionValues ;
    }

    return nameAccessSessionValues ;

} ;
