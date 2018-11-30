const ref = require('ref')
const Casteable = require('./Casteable')
const { cast } = require('../tools')
const StringArray = require('./StringArray')
const {
    CStartSessionMessage,
    CSessionInit,
    CActionSessionInit
} = require('../ffi/typedefs')

class StartSessionMessage extends Casteable {
    constructor(args) {
        super(args)
        this.type = CStartSessionMessage
    }

    fromBuffer(buffer) {
        return cast(buffer, {
            session_init: function(sessionInit) {
                const { init_type, value: valuePtr } = sessionInit
                let value = null
                const actionSessionInitPtr = ref.reinterpret(valuePtr, CActionSessionInit.size)
                if(init_type === 1) {
                    value = cast(ref.get(actionSessionInitPtr, 0, CActionSessionInit), {
                        can_be_enqueued: _ => String.fromCharCode(_),
                        intent_filter: intents => {
                            return new StringArray(intents)._array
                        }
                    })
                } else if(init_type === 2) {
                    value = valuePtr.readCString(0)
                }
                return {
                    init_type,
                    value
                }
            }
        })
    }

    forge() {
        return super.forge(this.type, {
            session_init: function(sessionInit) {
                return new Casteable(sessionInit).forge(CSessionInit, {
                    value: function(value) {
                        if(sessionInit.init_type === 1) {
                            return new Casteable(value).forge(CActionSessionInit, {
                                can_be_enqueued: _ => _,
                                intent_filter: intents => new StringArray(intents).forge()
                            }).ref()
                        } else if(sessionInit.init_type === 2) {
                            return ref.allocCString(value)
                        } else {
                            return ref.NULL
                        }
                    }
                })
            }
        })
    }
}

module.exports = StartSessionMessage