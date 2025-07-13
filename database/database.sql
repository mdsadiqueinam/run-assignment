create table public.users
(
    id                 uuid         default gen_random_uuid() not null
        constraint users_pk
            primary key,
    first_name         varchar(255) default ''                not null,
    last_name          varchar(255) default ''                not null,
    email              varchar(255)                           not null,
    phone              varchar(50)                            not null,
    user_permission_id varchar(255) default 'CLIENT'          not null,
    time_zone          varchar(50)  default 'UTC'             not null,
    created_at         timestamptz  default CURRENT_TIMESTAMP not null,
    updated_at         timestamptz                            not null,
    sync_id            integer                                not null,
    state_id           varchar(50)  default 'ACTIVE'          not null
);
COMMENT ON COLUMN "users"."updated_at" IS '@omit create,update,delete';
COMMENT ON COLUMN "users"."sync_id" IS '@omit create,update,delete';

create unique index users_email_uindex
    on public.users (email);

create table public.sync
(
    sync_id    integer                               not null,
    created_at timestamptz default CURRENT_TIMESTAMP not null,
    updated_at timestamptz                           not null,
    user_id    uuid                                  not null
        constraint sync_pk
            primary key
        constraint sync_users_id_fk
            references public.users
);
COMMENT ON COLUMN "sync"."sync_id" IS '@omit create,update,delete';
COMMENT ON COLUMN "sync"."updated_at" IS '@omit create,update,delete';

CREATE OR REPLACE FUNCTION update_lastsyncid_dateupdate()
    RETURNS trigger AS $$
DECLARE
    last_sync_id INT;
    new_row_json JSONB;
    target_ids UUID[] := '{}';  -- Array to collect unique UUIDs
    candidate_keys TEXT[] := ARRAY['user_id', 'client_id', 'doctor_id'];
    key TEXT;
    val TEXT;
    uid UUID;
BEGIN
    -- Always update the `updated_at` field
    NEW.updated_at := now();

    -- Generate sync_id
    last_sync_id := EXTRACT(EPOCH FROM now())::INT;

    -- Update sync_id in the row
    IF last_sync_id IS NOT NULL THEN
        NEW.sync_id := last_sync_id;
    END IF;

    -- Convert NEW row to JSONB
    new_row_json := to_jsonb(NEW);

    -- Look for candidate keys and collect UUIDs
    FOREACH key IN ARRAY candidate_keys LOOP
        val := new_row_json ->> key;
        IF val IS NOT NULL THEN
            BEGIN
                uid := val::UUID;
                IF NOT uid = ANY(target_ids) THEN
                    target_ids := array_append(target_ids, uid);
                END IF;
            EXCEPTION WHEN others THEN
                -- Skip invalid UUIDs
                CONTINUE;
            END;
        END IF;
    END LOOP;

    -- Update sync table for each unique ID
    FOREACH uid IN ARRAY target_ids LOOP
        UPDATE sync
        SET sync_id = last_sync_id,
            updated_at = now()
        WHERE user_id = uid;
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql VOLATILE COST 100;

CREATE TRIGGER "update_lastsyncid_dateupdate_users" BEFORE INSERT OR UPDATE ON public.users
    FOR EACH ROW EXECUTE PROCEDURE update_lastsyncid_dateupdate();