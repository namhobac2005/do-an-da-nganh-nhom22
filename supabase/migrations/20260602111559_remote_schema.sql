drop extension if exists "pg_net";


  create table "public"."activity_logs" (
    "id" uuid not null default gen_random_uuid(),
    "actor_id" uuid,
    "actor_email" text,
    "action" text not null,
    "target_type" text,
    "target_id" text,
    "details" jsonb default '{}'::jsonb,
    "created_at" timestamp with time zone not null default now()
      );



  create table "public"."actuator_logs" (
    "id" uuid not null default gen_random_uuid(),
    "actuator_id" uuid,
    "action" character varying(50),
    "mode" character varying(20),
    "status" character varying(20),
    "timestamp" timestamp without time zone default ((now() AT TIME ZONE 'utc'::text) + '07:00:00'::interval),
    "user_id" uuid
      );



  create table "public"."actuators" (
    "id" uuid not null default gen_random_uuid(),
    "pond_id" uuid,
    "name" character varying(100),
    "type" character varying(50),
    "mode" character varying(20),
    "status" character varying(20),
    "feed_key" character varying(100),
    "description" text
      );



  create table "public"."alert_logs" (
    "id" uuid not null default gen_random_uuid(),
    "zone_id" uuid,
    "metric" text not null,
    "recorded_value" double precision not null,
    "reason" text not null,
    "status" text not null default 'unread'::text,
    "created_at" timestamp with time zone not null default now()
      );



  create table "public"."alerts" (
    "id" uuid not null default gen_random_uuid(),
    "sensor_id" uuid,
    "message" text,
    "type" character varying(50),
    "created_at" timestamp without time zone default now()
      );



  create table "public"."device_schedules" (
    "id" uuid not null default gen_random_uuid(),
    "actuator_id" uuid not null,
    "target_level" integer not null,
    "schedule_at" timestamp with time zone not null,
    "status" text not null default 'pending'::text,
    "note" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );



  create table "public"."ponds" (
    "id" uuid not null default gen_random_uuid(),
    "zone_id" uuid,
    "location" text,
    "farming_type" character varying(100),
    "created_at" timestamp with time zone not null default now(),
    "name" character varying(100),
    "status" text default 'active'::text
      );



  create table "public"."schedules" (
    "id" uuid not null default gen_random_uuid(),
    "actuator_id" uuid,
    "start_time" timestamp without time zone,
    "end_time" timestamp without time zone,
    "loop_type" character varying(20)
      );



  create table "public"."sensor_data" (
    "sensor_id" uuid not null,
    "timestamp" timestamp without time zone not null default ((now() AT TIME ZONE 'utc'::text) + '07:00:00'::interval),
    "value" double precision
      );



  create table "public"."sensors" (
    "id" uuid not null default gen_random_uuid(),
    "pond_id" uuid,
    "name" character varying(100),
    "type" character varying(50),
    "unit" character varying(20),
    "status" character varying(20),
    "feed_key" character varying(100)
      );



  create table "public"."thresholds" (
    "id" uuid not null default gen_random_uuid(),
    "target_type" text not null,
    "target_id" text not null,
    "metric" text not null,
    "min_value" double precision not null,
    "max_value" double precision not null,
    "created_at" timestamp with time zone not null default now()
      );



  create table "public"."user_ponds" (
    "user_id" uuid not null,
    "pond_id" uuid not null
      );



  create table "public"."users" (
    "id" uuid not null default gen_random_uuid(),
    "username" character varying(100) not null,
    "email" character varying(100) not null,
    "password" character varying(255) not null,
    "role" character varying(20) default 'user'::character varying,
    "created_at" timestamp without time zone default now(),
    "status" text not null default 'active'::text,
    "updated_at" timestamp with time zone not null default now(),
    "phone" text
      );



  create table "public"."zones" (
    "id" uuid not null default gen_random_uuid(),
    "name" character varying(100) not null,
    "location" character varying(200),
    "status" text not null default 'active'::text,
    "description" text,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."zones" enable row level security;

CREATE UNIQUE INDEX activity_logs_pkey ON public.activity_logs USING btree (id);

CREATE UNIQUE INDEX actuator_logs_pkey ON public.actuator_logs USING btree (id);

CREATE UNIQUE INDEX actuators_feed_key_key ON public.actuators USING btree (feed_key);

CREATE UNIQUE INDEX actuators_pkey ON public.actuators USING btree (id);

CREATE UNIQUE INDEX alert_logs_pkey ON public.alert_logs USING btree (id);

CREATE UNIQUE INDEX alerts_pkey ON public.alerts USING btree (id);

CREATE UNIQUE INDEX device_schedules_pkey ON public.device_schedules USING btree (id);

CREATE INDEX idx_alert_logs_created_at ON public.alert_logs USING btree (created_at DESC);

CREATE INDEX idx_alert_logs_status ON public.alert_logs USING btree (status);

CREATE INDEX idx_alert_logs_zone_id ON public.alert_logs USING btree (zone_id);

CREATE INDEX idx_device_schedules_actuator ON public.device_schedules USING btree (actuator_id);

CREATE INDEX idx_device_schedules_status_time ON public.device_schedules USING btree (status, schedule_at);

CREATE INDEX idx_ponds_zone_id ON public.ponds USING btree (zone_id);

CREATE INDEX idx_user_ponds_pond_id ON public.user_ponds USING btree (pond_id);

CREATE INDEX idx_user_ponds_user_id ON public.user_ponds USING btree (user_id);

CREATE UNIQUE INDEX ponds_pkey ON public.ponds USING btree (id);

CREATE UNIQUE INDEX schedules_pkey ON public.schedules USING btree (id);

CREATE UNIQUE INDEX sensor_data_pkey ON public.sensor_data USING btree (sensor_id, "timestamp");

CREATE UNIQUE INDEX sensors_feed_key_key ON public.sensors USING btree (feed_key);

CREATE UNIQUE INDEX sensors_pkey ON public.sensors USING btree (id);

CREATE UNIQUE INDEX thresholds_pkey ON public.thresholds USING btree (id);

CREATE UNIQUE INDEX thresholds_unique ON public.thresholds USING btree (target_type, target_id, metric);

CREATE UNIQUE INDEX user_ponds_pkey ON public.user_ponds USING btree (user_id, pond_id);

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);

CREATE UNIQUE INDEX users_pkey ON public.users USING btree (id);

CREATE UNIQUE INDEX zones_pkey ON public.zones USING btree (id);

alter table "public"."activity_logs" add constraint "activity_logs_pkey" PRIMARY KEY using index "activity_logs_pkey";

alter table "public"."actuator_logs" add constraint "actuator_logs_pkey" PRIMARY KEY using index "actuator_logs_pkey";

alter table "public"."actuators" add constraint "actuators_pkey" PRIMARY KEY using index "actuators_pkey";

alter table "public"."alert_logs" add constraint "alert_logs_pkey" PRIMARY KEY using index "alert_logs_pkey";

alter table "public"."alerts" add constraint "alerts_pkey" PRIMARY KEY using index "alerts_pkey";

alter table "public"."device_schedules" add constraint "device_schedules_pkey" PRIMARY KEY using index "device_schedules_pkey";

alter table "public"."ponds" add constraint "ponds_pkey" PRIMARY KEY using index "ponds_pkey";

alter table "public"."schedules" add constraint "schedules_pkey" PRIMARY KEY using index "schedules_pkey";

alter table "public"."sensor_data" add constraint "sensor_data_pkey" PRIMARY KEY using index "sensor_data_pkey";

alter table "public"."sensors" add constraint "sensors_pkey" PRIMARY KEY using index "sensors_pkey";

alter table "public"."thresholds" add constraint "thresholds_pkey" PRIMARY KEY using index "thresholds_pkey";

alter table "public"."user_ponds" add constraint "user_ponds_pkey" PRIMARY KEY using index "user_ponds_pkey";

alter table "public"."users" add constraint "users_pkey" PRIMARY KEY using index "users_pkey";

alter table "public"."zones" add constraint "zones_pkey" PRIMARY KEY using index "zones_pkey";

alter table "public"."actuator_logs" add constraint "actuator_logs_actuator_id_fkey" FOREIGN KEY (actuator_id) REFERENCES public.actuators(id) ON DELETE CASCADE not valid;

alter table "public"."actuator_logs" validate constraint "actuator_logs_actuator_id_fkey";

alter table "public"."actuator_logs" add constraint "actuator_logs_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(id) not valid;

alter table "public"."actuator_logs" validate constraint "actuator_logs_user_id_fkey";

alter table "public"."actuators" add constraint "actuators_feed_key_key" UNIQUE using index "actuators_feed_key_key";

alter table "public"."actuators" add constraint "actuators_pond_id_fkey" FOREIGN KEY (pond_id) REFERENCES public.ponds(id) ON DELETE CASCADE not valid;

alter table "public"."actuators" validate constraint "actuators_pond_id_fkey";

alter table "public"."alert_logs" add constraint "alert_logs_status_check" CHECK ((status = ANY (ARRAY['unread'::text, 'resolved'::text]))) not valid;

alter table "public"."alert_logs" validate constraint "alert_logs_status_check";

alter table "public"."alert_logs" add constraint "alert_logs_zone_id_fkey" FOREIGN KEY (zone_id) REFERENCES public.zones(id) ON DELETE SET NULL not valid;

alter table "public"."alert_logs" validate constraint "alert_logs_zone_id_fkey";

alter table "public"."alerts" add constraint "alerts_sensor_id_fkey" FOREIGN KEY (sensor_id) REFERENCES public.sensors(id) ON DELETE CASCADE not valid;

alter table "public"."alerts" validate constraint "alerts_sensor_id_fkey";

alter table "public"."device_schedules" add constraint "device_schedules_actuator_id_fkey" FOREIGN KEY (actuator_id) REFERENCES public.actuators(id) ON DELETE CASCADE not valid;

alter table "public"."device_schedules" validate constraint "device_schedules_actuator_id_fkey";

alter table "public"."device_schedules" add constraint "device_schedules_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'done'::text, 'failed'::text, 'cancelled'::text]))) not valid;

alter table "public"."device_schedules" validate constraint "device_schedules_status_check";

alter table "public"."device_schedules" add constraint "device_schedules_target_level_check" CHECK (((target_level >= 0) AND (target_level <= 4))) not valid;

alter table "public"."device_schedules" validate constraint "device_schedules_target_level_check";

alter table "public"."ponds" add constraint "ponds_status_check" CHECK ((status = ANY (ARRAY['active'::text, 'inactive'::text, 'maintenance'::text]))) not valid;

alter table "public"."ponds" validate constraint "ponds_status_check";

alter table "public"."ponds" add constraint "ponds_zone_id_fkey" FOREIGN KEY (zone_id) REFERENCES public.zones(id) ON DELETE CASCADE not valid;

alter table "public"."ponds" validate constraint "ponds_zone_id_fkey";

alter table "public"."schedules" add constraint "schedules_actuator_id_fkey" FOREIGN KEY (actuator_id) REFERENCES public.actuators(id) ON DELETE CASCADE not valid;

alter table "public"."schedules" validate constraint "schedules_actuator_id_fkey";

alter table "public"."sensor_data" add constraint "sensor_data_sensor_id_fkey" FOREIGN KEY (sensor_id) REFERENCES public.sensors(id) ON DELETE CASCADE not valid;

alter table "public"."sensor_data" validate constraint "sensor_data_sensor_id_fkey";

alter table "public"."sensors" add constraint "sensors_feed_key_key" UNIQUE using index "sensors_feed_key_key";

alter table "public"."sensors" add constraint "sensors_pond_id_fkey" FOREIGN KEY (pond_id) REFERENCES public.ponds(id) ON DELETE CASCADE not valid;

alter table "public"."sensors" validate constraint "sensors_pond_id_fkey";

alter table "public"."thresholds" add constraint "thresholds_target_type_check" CHECK ((target_type = ANY (ARRAY['zone'::text, 'farming_type'::text, 'pond'::text]))) not valid;

alter table "public"."thresholds" validate constraint "thresholds_target_type_check";

alter table "public"."thresholds" add constraint "thresholds_unique" UNIQUE using index "thresholds_unique";

alter table "public"."user_ponds" add constraint "user_ponds_pond_id_fkey" FOREIGN KEY (pond_id) REFERENCES public.ponds(id) ON DELETE CASCADE not valid;

alter table "public"."user_ponds" validate constraint "user_ponds_pond_id_fkey";

alter table "public"."user_ponds" add constraint "user_ponds_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_ponds" validate constraint "user_ponds_user_id_fkey";

alter table "public"."users" add constraint "users_email_key" UNIQUE using index "users_email_key";

alter table "public"."users" add constraint "users_role_check" CHECK (((role)::text = ANY ((ARRAY['admin'::character varying, 'user'::character varying])::text[]))) not valid;

alter table "public"."users" validate constraint "users_role_check";

alter table "public"."users" add constraint "users_status_check" CHECK ((status = ANY (ARRAY['active'::text, 'inactive'::text]))) not valid;

alter table "public"."users" validate constraint "users_status_check";

alter table "public"."zones" add constraint "zones_status_check" CHECK ((status = ANY (ARRAY['active'::text, 'inactive'::text, 'maintenance'::text]))) not valid;

alter table "public"."zones" validate constraint "zones_status_check";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;

grant delete on table "public"."activity_logs" to "anon";

grant insert on table "public"."activity_logs" to "anon";

grant references on table "public"."activity_logs" to "anon";

grant select on table "public"."activity_logs" to "anon";

grant trigger on table "public"."activity_logs" to "anon";

grant truncate on table "public"."activity_logs" to "anon";

grant update on table "public"."activity_logs" to "anon";

grant delete on table "public"."activity_logs" to "authenticated";

grant insert on table "public"."activity_logs" to "authenticated";

grant references on table "public"."activity_logs" to "authenticated";

grant select on table "public"."activity_logs" to "authenticated";

grant trigger on table "public"."activity_logs" to "authenticated";

grant truncate on table "public"."activity_logs" to "authenticated";

grant update on table "public"."activity_logs" to "authenticated";

grant delete on table "public"."activity_logs" to "service_role";

grant insert on table "public"."activity_logs" to "service_role";

grant references on table "public"."activity_logs" to "service_role";

grant select on table "public"."activity_logs" to "service_role";

grant trigger on table "public"."activity_logs" to "service_role";

grant truncate on table "public"."activity_logs" to "service_role";

grant update on table "public"."activity_logs" to "service_role";

grant delete on table "public"."actuator_logs" to "anon";

grant insert on table "public"."actuator_logs" to "anon";

grant references on table "public"."actuator_logs" to "anon";

grant select on table "public"."actuator_logs" to "anon";

grant trigger on table "public"."actuator_logs" to "anon";

grant truncate on table "public"."actuator_logs" to "anon";

grant update on table "public"."actuator_logs" to "anon";

grant delete on table "public"."actuator_logs" to "authenticated";

grant insert on table "public"."actuator_logs" to "authenticated";

grant references on table "public"."actuator_logs" to "authenticated";

grant select on table "public"."actuator_logs" to "authenticated";

grant trigger on table "public"."actuator_logs" to "authenticated";

grant truncate on table "public"."actuator_logs" to "authenticated";

grant update on table "public"."actuator_logs" to "authenticated";

grant delete on table "public"."actuator_logs" to "service_role";

grant insert on table "public"."actuator_logs" to "service_role";

grant references on table "public"."actuator_logs" to "service_role";

grant select on table "public"."actuator_logs" to "service_role";

grant trigger on table "public"."actuator_logs" to "service_role";

grant truncate on table "public"."actuator_logs" to "service_role";

grant update on table "public"."actuator_logs" to "service_role";

grant delete on table "public"."actuators" to "anon";

grant insert on table "public"."actuators" to "anon";

grant references on table "public"."actuators" to "anon";

grant select on table "public"."actuators" to "anon";

grant trigger on table "public"."actuators" to "anon";

grant truncate on table "public"."actuators" to "anon";

grant update on table "public"."actuators" to "anon";

grant delete on table "public"."actuators" to "authenticated";

grant insert on table "public"."actuators" to "authenticated";

grant references on table "public"."actuators" to "authenticated";

grant select on table "public"."actuators" to "authenticated";

grant trigger on table "public"."actuators" to "authenticated";

grant truncate on table "public"."actuators" to "authenticated";

grant update on table "public"."actuators" to "authenticated";

grant delete on table "public"."actuators" to "service_role";

grant insert on table "public"."actuators" to "service_role";

grant references on table "public"."actuators" to "service_role";

grant select on table "public"."actuators" to "service_role";

grant trigger on table "public"."actuators" to "service_role";

grant truncate on table "public"."actuators" to "service_role";

grant update on table "public"."actuators" to "service_role";

grant delete on table "public"."alert_logs" to "anon";

grant insert on table "public"."alert_logs" to "anon";

grant references on table "public"."alert_logs" to "anon";

grant select on table "public"."alert_logs" to "anon";

grant trigger on table "public"."alert_logs" to "anon";

grant truncate on table "public"."alert_logs" to "anon";

grant update on table "public"."alert_logs" to "anon";

grant delete on table "public"."alert_logs" to "authenticated";

grant insert on table "public"."alert_logs" to "authenticated";

grant references on table "public"."alert_logs" to "authenticated";

grant select on table "public"."alert_logs" to "authenticated";

grant trigger on table "public"."alert_logs" to "authenticated";

grant truncate on table "public"."alert_logs" to "authenticated";

grant update on table "public"."alert_logs" to "authenticated";

grant delete on table "public"."alert_logs" to "service_role";

grant insert on table "public"."alert_logs" to "service_role";

grant references on table "public"."alert_logs" to "service_role";

grant select on table "public"."alert_logs" to "service_role";

grant trigger on table "public"."alert_logs" to "service_role";

grant truncate on table "public"."alert_logs" to "service_role";

grant update on table "public"."alert_logs" to "service_role";

grant delete on table "public"."alerts" to "anon";

grant insert on table "public"."alerts" to "anon";

grant references on table "public"."alerts" to "anon";

grant select on table "public"."alerts" to "anon";

grant trigger on table "public"."alerts" to "anon";

grant truncate on table "public"."alerts" to "anon";

grant update on table "public"."alerts" to "anon";

grant delete on table "public"."alerts" to "authenticated";

grant insert on table "public"."alerts" to "authenticated";

grant references on table "public"."alerts" to "authenticated";

grant select on table "public"."alerts" to "authenticated";

grant trigger on table "public"."alerts" to "authenticated";

grant truncate on table "public"."alerts" to "authenticated";

grant update on table "public"."alerts" to "authenticated";

grant delete on table "public"."alerts" to "service_role";

grant insert on table "public"."alerts" to "service_role";

grant references on table "public"."alerts" to "service_role";

grant select on table "public"."alerts" to "service_role";

grant trigger on table "public"."alerts" to "service_role";

grant truncate on table "public"."alerts" to "service_role";

grant update on table "public"."alerts" to "service_role";

grant delete on table "public"."device_schedules" to "anon";

grant insert on table "public"."device_schedules" to "anon";

grant references on table "public"."device_schedules" to "anon";

grant select on table "public"."device_schedules" to "anon";

grant trigger on table "public"."device_schedules" to "anon";

grant truncate on table "public"."device_schedules" to "anon";

grant update on table "public"."device_schedules" to "anon";

grant delete on table "public"."device_schedules" to "authenticated";

grant insert on table "public"."device_schedules" to "authenticated";

grant references on table "public"."device_schedules" to "authenticated";

grant select on table "public"."device_schedules" to "authenticated";

grant trigger on table "public"."device_schedules" to "authenticated";

grant truncate on table "public"."device_schedules" to "authenticated";

grant update on table "public"."device_schedules" to "authenticated";

grant delete on table "public"."device_schedules" to "service_role";

grant insert on table "public"."device_schedules" to "service_role";

grant references on table "public"."device_schedules" to "service_role";

grant select on table "public"."device_schedules" to "service_role";

grant trigger on table "public"."device_schedules" to "service_role";

grant truncate on table "public"."device_schedules" to "service_role";

grant update on table "public"."device_schedules" to "service_role";

grant delete on table "public"."ponds" to "anon";

grant insert on table "public"."ponds" to "anon";

grant references on table "public"."ponds" to "anon";

grant select on table "public"."ponds" to "anon";

grant trigger on table "public"."ponds" to "anon";

grant truncate on table "public"."ponds" to "anon";

grant update on table "public"."ponds" to "anon";

grant delete on table "public"."ponds" to "authenticated";

grant insert on table "public"."ponds" to "authenticated";

grant references on table "public"."ponds" to "authenticated";

grant select on table "public"."ponds" to "authenticated";

grant trigger on table "public"."ponds" to "authenticated";

grant truncate on table "public"."ponds" to "authenticated";

grant update on table "public"."ponds" to "authenticated";

grant delete on table "public"."ponds" to "service_role";

grant insert on table "public"."ponds" to "service_role";

grant references on table "public"."ponds" to "service_role";

grant select on table "public"."ponds" to "service_role";

grant trigger on table "public"."ponds" to "service_role";

grant truncate on table "public"."ponds" to "service_role";

grant update on table "public"."ponds" to "service_role";

grant delete on table "public"."schedules" to "anon";

grant insert on table "public"."schedules" to "anon";

grant references on table "public"."schedules" to "anon";

grant select on table "public"."schedules" to "anon";

grant trigger on table "public"."schedules" to "anon";

grant truncate on table "public"."schedules" to "anon";

grant update on table "public"."schedules" to "anon";

grant delete on table "public"."schedules" to "authenticated";

grant insert on table "public"."schedules" to "authenticated";

grant references on table "public"."schedules" to "authenticated";

grant select on table "public"."schedules" to "authenticated";

grant trigger on table "public"."schedules" to "authenticated";

grant truncate on table "public"."schedules" to "authenticated";

grant update on table "public"."schedules" to "authenticated";

grant delete on table "public"."schedules" to "service_role";

grant insert on table "public"."schedules" to "service_role";

grant references on table "public"."schedules" to "service_role";

grant select on table "public"."schedules" to "service_role";

grant trigger on table "public"."schedules" to "service_role";

grant truncate on table "public"."schedules" to "service_role";

grant update on table "public"."schedules" to "service_role";

grant delete on table "public"."sensor_data" to "anon";

grant insert on table "public"."sensor_data" to "anon";

grant references on table "public"."sensor_data" to "anon";

grant select on table "public"."sensor_data" to "anon";

grant trigger on table "public"."sensor_data" to "anon";

grant truncate on table "public"."sensor_data" to "anon";

grant update on table "public"."sensor_data" to "anon";

grant delete on table "public"."sensor_data" to "authenticated";

grant insert on table "public"."sensor_data" to "authenticated";

grant references on table "public"."sensor_data" to "authenticated";

grant select on table "public"."sensor_data" to "authenticated";

grant trigger on table "public"."sensor_data" to "authenticated";

grant truncate on table "public"."sensor_data" to "authenticated";

grant update on table "public"."sensor_data" to "authenticated";

grant delete on table "public"."sensor_data" to "service_role";

grant insert on table "public"."sensor_data" to "service_role";

grant references on table "public"."sensor_data" to "service_role";

grant select on table "public"."sensor_data" to "service_role";

grant trigger on table "public"."sensor_data" to "service_role";

grant truncate on table "public"."sensor_data" to "service_role";

grant update on table "public"."sensor_data" to "service_role";

grant delete on table "public"."sensors" to "anon";

grant insert on table "public"."sensors" to "anon";

grant references on table "public"."sensors" to "anon";

grant select on table "public"."sensors" to "anon";

grant trigger on table "public"."sensors" to "anon";

grant truncate on table "public"."sensors" to "anon";

grant update on table "public"."sensors" to "anon";

grant delete on table "public"."sensors" to "authenticated";

grant insert on table "public"."sensors" to "authenticated";

grant references on table "public"."sensors" to "authenticated";

grant select on table "public"."sensors" to "authenticated";

grant trigger on table "public"."sensors" to "authenticated";

grant truncate on table "public"."sensors" to "authenticated";

grant update on table "public"."sensors" to "authenticated";

grant delete on table "public"."sensors" to "service_role";

grant insert on table "public"."sensors" to "service_role";

grant references on table "public"."sensors" to "service_role";

grant select on table "public"."sensors" to "service_role";

grant trigger on table "public"."sensors" to "service_role";

grant truncate on table "public"."sensors" to "service_role";

grant update on table "public"."sensors" to "service_role";

grant delete on table "public"."thresholds" to "anon";

grant insert on table "public"."thresholds" to "anon";

grant references on table "public"."thresholds" to "anon";

grant select on table "public"."thresholds" to "anon";

grant trigger on table "public"."thresholds" to "anon";

grant truncate on table "public"."thresholds" to "anon";

grant update on table "public"."thresholds" to "anon";

grant delete on table "public"."thresholds" to "authenticated";

grant insert on table "public"."thresholds" to "authenticated";

grant references on table "public"."thresholds" to "authenticated";

grant select on table "public"."thresholds" to "authenticated";

grant trigger on table "public"."thresholds" to "authenticated";

grant truncate on table "public"."thresholds" to "authenticated";

grant update on table "public"."thresholds" to "authenticated";

grant delete on table "public"."thresholds" to "service_role";

grant insert on table "public"."thresholds" to "service_role";

grant references on table "public"."thresholds" to "service_role";

grant select on table "public"."thresholds" to "service_role";

grant trigger on table "public"."thresholds" to "service_role";

grant truncate on table "public"."thresholds" to "service_role";

grant update on table "public"."thresholds" to "service_role";

grant delete on table "public"."user_ponds" to "anon";

grant insert on table "public"."user_ponds" to "anon";

grant references on table "public"."user_ponds" to "anon";

grant select on table "public"."user_ponds" to "anon";

grant trigger on table "public"."user_ponds" to "anon";

grant truncate on table "public"."user_ponds" to "anon";

grant update on table "public"."user_ponds" to "anon";

grant delete on table "public"."user_ponds" to "authenticated";

grant insert on table "public"."user_ponds" to "authenticated";

grant references on table "public"."user_ponds" to "authenticated";

grant select on table "public"."user_ponds" to "authenticated";

grant trigger on table "public"."user_ponds" to "authenticated";

grant truncate on table "public"."user_ponds" to "authenticated";

grant update on table "public"."user_ponds" to "authenticated";

grant delete on table "public"."user_ponds" to "service_role";

grant insert on table "public"."user_ponds" to "service_role";

grant references on table "public"."user_ponds" to "service_role";

grant select on table "public"."user_ponds" to "service_role";

grant trigger on table "public"."user_ponds" to "service_role";

grant truncate on table "public"."user_ponds" to "service_role";

grant update on table "public"."user_ponds" to "service_role";

grant delete on table "public"."users" to "anon";

grant insert on table "public"."users" to "anon";

grant references on table "public"."users" to "anon";

grant select on table "public"."users" to "anon";

grant trigger on table "public"."users" to "anon";

grant truncate on table "public"."users" to "anon";

grant update on table "public"."users" to "anon";

grant delete on table "public"."users" to "authenticated";

grant insert on table "public"."users" to "authenticated";

grant references on table "public"."users" to "authenticated";

grant select on table "public"."users" to "authenticated";

grant trigger on table "public"."users" to "authenticated";

grant truncate on table "public"."users" to "authenticated";

grant update on table "public"."users" to "authenticated";

grant delete on table "public"."users" to "service_role";

grant insert on table "public"."users" to "service_role";

grant references on table "public"."users" to "service_role";

grant select on table "public"."users" to "service_role";

grant trigger on table "public"."users" to "service_role";

grant truncate on table "public"."users" to "service_role";

grant update on table "public"."users" to "service_role";

grant delete on table "public"."zones" to "anon";

grant insert on table "public"."zones" to "anon";

grant references on table "public"."zones" to "anon";

grant select on table "public"."zones" to "anon";

grant trigger on table "public"."zones" to "anon";

grant truncate on table "public"."zones" to "anon";

grant update on table "public"."zones" to "anon";

grant delete on table "public"."zones" to "authenticated";

grant insert on table "public"."zones" to "authenticated";

grant references on table "public"."zones" to "authenticated";

grant select on table "public"."zones" to "authenticated";

grant trigger on table "public"."zones" to "authenticated";

grant truncate on table "public"."zones" to "authenticated";

grant update on table "public"."zones" to "authenticated";

grant delete on table "public"."zones" to "service_role";

grant insert on table "public"."zones" to "service_role";

grant references on table "public"."zones" to "service_role";

grant select on table "public"."zones" to "service_role";

grant trigger on table "public"."zones" to "service_role";

grant truncate on table "public"."zones" to "service_role";

grant update on table "public"."zones" to "service_role";


  create policy "Allow all"
  on "public"."activity_logs"
  as permissive
  for all
  to public
using (true);



  create policy "Allow all"
  on "public"."actuator_logs"
  as permissive
  for all
  to public
using (true);



  create policy "Allow all"
  on "public"."actuators"
  as permissive
  for all
  to public
using (true);



  create policy "Allow all"
  on "public"."alert_logs"
  as permissive
  for all
  to public
using (true);



  create policy "Allow all"
  on "public"."alerts"
  as permissive
  for all
  to public
using (true);



  create policy "Allow all"
  on "public"."device_schedules"
  as permissive
  for all
  to public
using (true);



  create policy "Allow all"
  on "public"."ponds"
  as permissive
  for all
  to public
using (true);



  create policy "Allow all"
  on "public"."schedules"
  as permissive
  for all
  to public
using (true);



  create policy "Allow all"
  on "public"."sensor_data"
  as permissive
  for all
  to public
using (true);



  create policy "Allow all"
  on "public"."sensors"
  as permissive
  for all
  to public
using (true);



  create policy "Allow all"
  on "public"."thresholds"
  as permissive
  for all
  to public
using (true);



  create policy "Allow all"
  on "public"."users"
  as permissive
  for all
  to public
using (true);



  create policy "Allow all"
  on "public"."zones"
  as permissive
  for all
  to public
using (true);



  create policy "zones_read_authenticated"
  on "public"."zones"
  as permissive
  for select
  to authenticated
using (true);


CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


