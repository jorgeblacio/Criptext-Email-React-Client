#include "IdentityKeyStore.h"
#include "../store.h"
#include "../uthash.h"
#include <string>
#include <vector>

int identity_key_store_get_identity_key_pair(signal_buffer **public_data, signal_buffer **private_data, void *user_data)
{
    CriptextDB::Account *account = (CriptextDB::Account*)user_data;
    const uint8_t *pubKey = reinterpret_cast<const uint8_t*>(account->pubKey.c_str());
    const uint8_t *privKey = reinterpret_cast<const uint8_t*>(account->privKey.c_str());
    signal_buffer *pubKeyBuffer = signal_buffer_create(pubKey, sizeof(pubKey));
    signal_buffer *privKeyBuffer = signal_buffer_create(privKey, sizeof(pubKey));
    *public_data = pubKeyBuffer;
    *private_data = privKeyBuffer;
    return 0;
}

int identity_key_store_get_local_registration_id(void *user_data, uint32_t *registration_id)
{
    CriptextDB::Account *account = (CriptextDB::Account*)user_data;
    *registration_id = account->registrationId;
    return 0;
}

int identity_key_store_save_identity(const signal_protocol_address *address, uint8_t *key_data, size_t key_len, void *user_data)
{
    CriptextDB::Account* account = (CriptextDB::Account*)user_data;
    string recipientId = std::string(address->name);
    int deviceId = address->device_id;
    
    string identityKey = std::string(key_data, key_data + key_len);

    CriptextDB::createIdentityKey("Criptext.db", recipientId, deviceId, identityKey, account->id);
    return 1;
}

int identity_key_store_is_trusted_identity(const signal_protocol_address *address, uint8_t *key_data, size_t key_len, void *user_data)
{
    return 1;
}

void identity_key_store_destroy(void *user_data)
{
}

void setup_identity_key_store(signal_protocol_store_context *context, signal_context *global_context, CriptextDB::Account *account)
{
    signal_protocol_identity_key_store store = {
            .get_identity_key_pair = identity_key_store_get_identity_key_pair,
            .get_local_registration_id = identity_key_store_get_local_registration_id,
            .save_identity = identity_key_store_save_identity,
            .is_trusted_identity = identity_key_store_is_trusted_identity,
            .destroy_func = identity_key_store_destroy,
            .user_data = account
    };
    signal_protocol_store_context_set_identity_key_store(context, &store);
}