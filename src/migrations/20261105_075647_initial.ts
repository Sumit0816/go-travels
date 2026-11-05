import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_bookings_hotel_category" AS ENUM('standard3', 'deluxe4', 'luxury5');
  CREATE TYPE "public"."enum_bookings_status" AS ENUM('new', 'contacted', 'confirmed', 'cancelled');
  CREATE TYPE "public"."enum_bookings_whatsapp_status" AS ENUM('notSent', 'queued', 'sent', 'delivered', 'read', 'failed');
  CREATE TYPE "public"."enum_bookings_source" AS ENUM('website', 'phone', 'enquiry');
  CREATE TYPE "public"."enum_enquiries_trip_type" AS ENUM('domestic', 'international', 'honeymoon', 'religious', 'family', 'mice');
  CREATE TYPE "public"."enum_enquiries_travellers" AS ENUM('2-adults', 'family-2-2', 'group-6', 'solo');
  CREATE TYPE "public"."enum_enquiries_budget" AS ENUM('under-25k', '25k-50k', '50k-1l', '1l-plus');
  CREATE TYPE "public"."enum_enquiries_status" AS ENUM('new', 'contacted', 'quoteSent', 'converted', 'closed');
  CREATE TYPE "public"."enum_enquiries_source" AS ENUM('tripFinder', 'contactForm', 'askWhatsApp', 'phone');
  CREATE TYPE "public"."enum_enquiries_whatsapp_status" AS ENUM('notSent', 'queued', 'sent', 'delivered', 'read', 'failed');
  CREATE TYPE "public"."enum_packages_themes" AS ENUM('beach', 'family', 'couples', 'honeymoon', 'adventure', 'luxury', 'value', 'pilgrimage', 'corporate');
  CREATE TYPE "public"."enum_packages_hotel_options_category" AS ENUM('standard3', 'deluxe4', 'luxury5');
  CREATE TYPE "public"."enum_packages_status" AS ENUM('draft', 'published', 'archived');
  CREATE TYPE "public"."enum_packages_badge" AS ENUM('none', 'bestseller', 'new', 'limitedOffer');
  CREATE TYPE "public"."enum__packages_v_version_themes" AS ENUM('beach', 'family', 'couples', 'honeymoon', 'adventure', 'luxury', 'value', 'pilgrimage', 'corporate');
  CREATE TYPE "public"."enum__packages_v_version_hotel_options_category" AS ENUM('standard3', 'deluxe4', 'luxury5');
  CREATE TYPE "public"."enum__packages_v_version_status" AS ENUM('draft', 'published', 'archived');
  CREATE TYPE "public"."enum__packages_v_version_badge" AS ENUM('none', 'bestseller', 'new', 'limitedOffer');
  CREATE TYPE "public"."enum_destinations_tone" AS ENUM('coast', 'desert', 'forest', 'romance', 'pilgrim', 'mountain');
  CREATE TYPE "public"."enum_categories_colour" AS ENUM('ocean', 'ink', 'pilgrim', 'plum', 'forest', 'marigold', 'mountain');
  CREATE TYPE "public"."enum_slides_link_type" AS ENUM('category', 'destination', 'package', 'page', 'custom');
  CREATE TYPE "public"."enum_testimonials_status" AS ENUM('pending', 'approved', 'hidden');
  CREATE TYPE "public"."enum_testimonials_source" AS ENUM('reviewLink', 'staff', 'google');
  CREATE TYPE "public"."enum_posts_status" AS ENUM('draft', 'published', 'scheduled');
  CREATE TYPE "public"."enum__posts_v_version_status" AS ENUM('draft', 'published', 'scheduled');
  CREATE TYPE "public"."enum_pages_blocks_cta_link_type" AS ENUM('category', 'destination', 'package', 'page', 'custom');
  CREATE TYPE "public"."enum_pages_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__pages_v_blocks_cta_link_type" AS ENUM('category', 'destination', 'package', 'page', 'custom');
  CREATE TYPE "public"."enum__pages_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_media_folder" AS ENUM('packages', 'destinations', 'slider', 'blog', 'brand', 'general');
  CREATE TYPE "public"."enum_users_role" AS ENUM('owner', 'manager', 'sales', 'contentEditor');
  CREATE TYPE "public"."enum_users_whatsapp_alerts" AS ENUM('primary', 'yes', 'assignedOnly', 'no');
  CREATE TYPE "public"."enum_users_status" AS ENUM('invited', 'active', 'suspended');
  CREATE TYPE "public"."enum_message_log_kind" AS ENUM('booking', 'enquiry', 'customerCopy', 'reviewLink', 'test');
  CREATE TYPE "public"."enum_message_log_provider" AS ENUM('gupshup', 'interakt', 'wati', 'aisensy', 'msg91', 'twilio');
  CREATE TYPE "public"."enum_message_log_status" AS ENUM('queued', 'sent', 'delivered', 'read', 'failed');
  CREATE TYPE "public"."enum_homepage_sections_section" AS ENUM('slider', 'search', 'popular', 'categories', 'whyUs', 'ctaBand', 'testimonials');
  CREATE TYPE "public"."enum_homepage_why_us_items_icon" AS ENUM('mapPin', 'clock', 'phone', 'check', 'whatsapp');
  CREATE TYPE "public"."enum_navigation_header_mega_menu_links_link_type" AS ENUM('category', 'destination', 'package', 'page', 'custom');
  CREATE TYPE "public"."enum_navigation_header_link_type" AS ENUM('category', 'destination', 'package', 'page', 'custom');
  CREATE TYPE "public"."enum_navigation_footer_quick_links_link_type" AS ENUM('category', 'destination', 'package', 'page', 'custom');
  CREATE TYPE "public"."enum_navigation_footer_tours_link_type" AS ENUM('category', 'destination', 'package', 'page', 'custom');
  CREATE TYPE "public"."enum_whatsapp_settings_provider" AS ENUM('gupshup', 'interakt', 'wati', 'aisensy', 'msg91', 'twilio');
  CREATE TYPE "public"."enum_whatsapp_settings_connection_status" AS ENUM('notConnected', 'connected', 'error');
  CREATE TABLE "bookings_internal_notes" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL,
  	"author_id" integer,
  	"at" timestamp(3) with time zone
  );
  
  CREATE TABLE "bookings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"request_id" varchar,
  	"package_id" integer,
  	"package_snapshot_title" varchar,
  	"package_snapshot_duration" varchar,
  	"travel_date" timestamp(3) with time zone NOT NULL,
  	"departure_city" varchar,
  	"hotel_category" "enum_bookings_hotel_category",
  	"rooms" numeric DEFAULT 1,
  	"adults" numeric DEFAULT 2 NOT NULL,
  	"children" numeric DEFAULT 0,
  	"estimated_total" numeric,
  	"name" varchar NOT NULL,
  	"whatsapp" varchar NOT NULL,
  	"email" varchar,
  	"city" varchar,
  	"special_requests" varchar,
  	"consent" boolean,
  	"status" "enum_bookings_status" DEFAULT 'new' NOT NULL,
  	"assigned_to_id" integer,
  	"whatsapp_status" "enum_bookings_whatsapp_status" DEFAULT 'notSent',
  	"source" "enum_bookings_source" DEFAULT 'website',
  	"from_enquiry_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "bookings_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "enquiries_internal_notes" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL,
  	"author_id" integer,
  	"at" timestamp(3) with time zone
  );
  
  CREATE TABLE "enquiries" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"enquiry_id" varchar,
  	"name" varchar NOT NULL,
  	"whatsapp" varchar NOT NULL,
  	"email" varchar,
  	"trip_type" "enum_enquiries_trip_type",
  	"destination" varchar,
  	"travel_month" varchar,
  	"travellers" "enum_enquiries_travellers",
  	"budget" "enum_enquiries_budget",
  	"message" varchar,
  	"package_id" integer,
  	"status" "enum_enquiries_status" DEFAULT 'new' NOT NULL,
  	"assigned_to_id" integer,
  	"source" "enum_enquiries_source" DEFAULT 'tripFinder' NOT NULL,
  	"whatsapp_status" "enum_enquiries_whatsapp_status" DEFAULT 'notSent',
  	"converted_booking_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "packages_themes" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_packages_themes",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "packages_itinerary" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"description" varchar
  );
  
  CREATE TABLE "packages_inclusions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"item" varchar NOT NULL
  );
  
  CREATE TABLE "packages_exclusions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"item" varchar NOT NULL
  );
  
  CREATE TABLE "packages_hotel_options" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"category" "enum_packages_hotel_options_category" NOT NULL,
  	"price" numeric NOT NULL,
  	"strike_price" numeric,
  	"is_popular" boolean,
  	"hotel_name" varchar
  );
  
  CREATE TABLE "packages_add_ons" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"price" numeric
  );
  
  CREATE TABLE "packages_faqs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar NOT NULL,
  	"answer" varchar NOT NULL
  );
  
  CREATE TABLE "packages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"generate_slug" boolean DEFAULT true,
  	"slug" varchar NOT NULL,
  	"tour_code" varchar NOT NULL,
  	"destination_id" integer NOT NULL,
  	"duration_nights" numeric NOT NULL,
  	"duration_days" numeric,
  	"pickup" varchar,
  	"cities" varchar,
  	"card_inclusions" varchar,
  	"highlights_stay" varchar,
  	"highlights_meals" varchar,
  	"highlights_transport" varchar,
  	"overview" jsonb,
  	"child_price_percent" numeric DEFAULT 50,
  	"policies" jsonb,
  	"seo_meta_title" varchar,
  	"seo_meta_description" varchar,
  	"seo_og_image_id" integer,
  	"status" "enum_packages_status" DEFAULT 'draft' NOT NULL,
  	"badge" "enum_packages_badge" DEFAULT 'none',
  	"show_in_popular" boolean DEFAULT false,
  	"feature_on_slider" boolean DEFAULT false,
  	"starting_price" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "packages_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"categories_id" integer,
  	"media_id" integer
  );
  
  CREATE TABLE "_packages_v_version_themes" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum__packages_v_version_themes",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "_packages_v_version_itinerary" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"description" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_packages_v_version_inclusions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"item" varchar NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_packages_v_version_exclusions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"item" varchar NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_packages_v_version_hotel_options" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"category" "enum__packages_v_version_hotel_options_category" NOT NULL,
  	"price" numeric NOT NULL,
  	"strike_price" numeric,
  	"is_popular" boolean,
  	"hotel_name" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_packages_v_version_add_ons" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"price" numeric,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_packages_v_version_faqs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"question" varchar NOT NULL,
  	"answer" varchar NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_packages_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar NOT NULL,
  	"version_generate_slug" boolean DEFAULT true,
  	"version_slug" varchar NOT NULL,
  	"version_tour_code" varchar NOT NULL,
  	"version_destination_id" integer NOT NULL,
  	"version_duration_nights" numeric NOT NULL,
  	"version_duration_days" numeric,
  	"version_pickup" varchar,
  	"version_cities" varchar,
  	"version_card_inclusions" varchar,
  	"version_highlights_stay" varchar,
  	"version_highlights_meals" varchar,
  	"version_highlights_transport" varchar,
  	"version_overview" jsonb,
  	"version_child_price_percent" numeric DEFAULT 50,
  	"version_policies" jsonb,
  	"version_seo_meta_title" varchar,
  	"version_seo_meta_description" varchar,
  	"version_seo_og_image_id" integer,
  	"version_status" "enum__packages_v_version_status" DEFAULT 'draft' NOT NULL,
  	"version_badge" "enum__packages_v_version_badge" DEFAULT 'none',
  	"version_show_in_popular" boolean DEFAULT false,
  	"version_feature_on_slider" boolean DEFAULT false,
  	"version_starting_price" numeric,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "_packages_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"categories_id" integer,
  	"media_id" integer
  );
  
  CREATE TABLE "destinations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"generate_slug" boolean DEFAULT true,
  	"slug" varchar NOT NULL,
  	"region" varchar,
  	"is_international" boolean DEFAULT false,
  	"tone" "enum_destinations_tone" DEFAULT 'coast',
  	"thumbnail_id" integer,
  	"hero_image_id" integer,
  	"intro" varchar,
  	"description" jsonb,
  	"has_page" boolean DEFAULT true,
  	"seo_meta_title" varchar,
  	"seo_meta_description" varchar,
  	"seo_og_image_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "categories" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"_order" varchar,
  	"name" varchar NOT NULL,
  	"generate_slug" boolean DEFAULT true,
  	"slug" varchar NOT NULL,
  	"eyebrow" varchar,
  	"subtitle" varchar,
  	"intro" varchar,
  	"colour" "enum_categories_colour" DEFAULT 'ocean',
  	"hero_image_id" integer,
  	"show_on_home" boolean DEFAULT true,
  	"seo_meta_title" varchar,
  	"seo_meta_description" varchar,
  	"seo_og_image_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "categories_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"destinations_id" integer
  );
  
  CREATE TABLE "slides" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"_order" varchar,
  	"eyebrow" varchar,
  	"heading" varchar NOT NULL,
  	"button_label" varchar DEFAULT 'Explore Packages' NOT NULL,
  	"link_type" "enum_slides_link_type" DEFAULT 'custom' NOT NULL,
  	"category_id" integer,
  	"destination_id" integer,
  	"package_id" integer,
  	"page_id" integer,
  	"url" varchar,
  	"image_desktop_id" integer NOT NULL,
  	"image_mobile_id" integer,
  	"show_from" timestamp(3) with time zone,
  	"show_until" timestamp(3) with time zone,
  	"active" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "testimonials" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"package_id" integer,
  	"trip_label" varchar,
  	"rating" numeric DEFAULT 5 NOT NULL,
  	"text" varchar NOT NULL,
  	"photo_id" integer,
  	"status" "enum_testimonials_status" DEFAULT 'pending' NOT NULL,
  	"source" "enum_testimonials_source" DEFAULT 'staff' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "review_links" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"token" varchar NOT NULL,
  	"name" varchar NOT NULL,
  	"phone" varchar NOT NULL,
  	"package_id" integer,
  	"expires_at" timestamp(3) with time zone NOT NULL,
  	"used_at" timestamp(3) with time zone,
  	"testimonial_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "posts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"generate_slug" boolean DEFAULT true,
  	"slug" varchar NOT NULL,
  	"excerpt" varchar,
  	"cover_id" integer,
  	"content" jsonb NOT NULL,
  	"seo_meta_title" varchar,
  	"seo_meta_description" varchar,
  	"seo_og_image_id" integer,
  	"status" "enum_posts_status" DEFAULT 'draft' NOT NULL,
  	"published_at" timestamp(3) with time zone,
  	"category_id" integer,
  	"author_id" integer,
  	"featured" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "_posts_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar NOT NULL,
  	"version_generate_slug" boolean DEFAULT true,
  	"version_slug" varchar NOT NULL,
  	"version_excerpt" varchar,
  	"version_cover_id" integer,
  	"version_content" jsonb NOT NULL,
  	"version_seo_meta_title" varchar,
  	"version_seo_meta_description" varchar,
  	"version_seo_og_image_id" integer,
  	"version_status" "enum__posts_v_version_status" DEFAULT 'draft' NOT NULL,
  	"version_published_at" timestamp(3) with time zone,
  	"version_category_id" integer,
  	"version_author_id" integer,
  	"version_featured" boolean DEFAULT false,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "post_categories" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"generate_slug" boolean DEFAULT true,
  	"slug" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "pages_blocks_hero" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar NOT NULL,
  	"intro" varchar,
  	"image_id" integer,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_rich_text" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"content" jsonb NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_stats_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar NOT NULL,
  	"label" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_stats" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_features_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "pages_blocks_features" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_team_members" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"role" varchar,
  	"photo_id" integer
  );
  
  CREATE TABLE "pages_blocks_team" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_cta" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar NOT NULL,
  	"text" varchar,
  	"button_label" varchar NOT NULL,
  	"link_type" "enum_pages_blocks_cta_link_type" DEFAULT 'custom' NOT NULL,
  	"category_id" integer,
  	"destination_id" integer,
  	"package_id" integer,
  	"page_id" integer,
  	"url" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"generate_slug" boolean DEFAULT true,
  	"slug" varchar NOT NULL,
  	"seo_meta_title" varchar,
  	"seo_meta_description" varchar,
  	"seo_og_image_id" integer,
  	"status" "enum_pages_status" DEFAULT 'draft' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_hero" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar NOT NULL,
  	"intro" varchar,
  	"image_id" integer,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_rich_text" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"content" jsonb NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_stats_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"value" varchar NOT NULL,
  	"label" varchar NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_stats" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_features_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_features" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_team_members" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"role" varchar,
  	"photo_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_team" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_cta" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar NOT NULL,
  	"text" varchar,
  	"button_label" varchar NOT NULL,
  	"link_type" "enum__pages_v_blocks_cta_link_type" DEFAULT 'custom' NOT NULL,
  	"category_id" integer,
  	"destination_id" integer,
  	"package_id" integer,
  	"page_id" integer,
  	"url" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar NOT NULL,
  	"version_generate_slug" boolean DEFAULT true,
  	"version_slug" varchar NOT NULL,
  	"version_seo_meta_title" varchar,
  	"version_seo_meta_description" varchar,
  	"version_seo_og_image_id" integer,
  	"version_status" "enum__pages_v_version_status" DEFAULT 'draft' NOT NULL,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar NOT NULL,
  	"folder" "enum_media_folder" DEFAULT 'general',
  	"credit" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric,
  	"sizes_thumbnail_url" varchar,
  	"sizes_thumbnail_width" numeric,
  	"sizes_thumbnail_height" numeric,
  	"sizes_thumbnail_mime_type" varchar,
  	"sizes_thumbnail_filesize" numeric,
  	"sizes_thumbnail_filename" varchar,
  	"sizes_card_url" varchar,
  	"sizes_card_width" numeric,
  	"sizes_card_height" numeric,
  	"sizes_card_mime_type" varchar,
  	"sizes_card_filesize" numeric,
  	"sizes_card_filename" varchar,
  	"sizes_hero_url" varchar,
  	"sizes_hero_width" numeric,
  	"sizes_hero_height" numeric,
  	"sizes_hero_mime_type" varchar,
  	"sizes_hero_filesize" numeric,
  	"sizes_hero_filename" varchar,
  	"sizes_hero_mobile_url" varchar,
  	"sizes_hero_mobile_width" numeric,
  	"sizes_hero_mobile_height" numeric,
  	"sizes_hero_mobile_mime_type" varchar,
  	"sizes_hero_mobile_filesize" numeric,
  	"sizes_hero_mobile_filename" varchar,
  	"sizes_og_url" varchar,
  	"sizes_og_width" numeric,
  	"sizes_og_height" numeric,
  	"sizes_og_mime_type" varchar,
  	"sizes_og_filesize" numeric,
  	"sizes_og_filename" varchar
  );
  
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"phone" varchar,
  	"role" "enum_users_role" DEFAULT 'contentEditor' NOT NULL,
  	"whatsapp_alerts" "enum_users_whatsapp_alerts" DEFAULT 'no' NOT NULL,
  	"status" "enum_users_status" DEFAULT 'invited' NOT NULL,
  	"last_active" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"reset_password_requested_at" timestamp(3) with time zone,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "message_log" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"reference" varchar NOT NULL,
  	"kind" "enum_message_log_kind" NOT NULL,
  	"booking_id" integer,
  	"enquiry_id" integer,
  	"recipient_label" varchar,
  	"phone" varchar NOT NULL,
  	"provider" "enum_message_log_provider",
  	"provider_message_id" varchar,
  	"template" varchar,
  	"status" "enum_message_log_status" DEFAULT 'queued' NOT NULL,
  	"attempts" numeric DEFAULT 0,
  	"error" varchar,
  	"delivered_at" timestamp(3) with time zone,
  	"read_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "counters" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"value" numeric NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"bookings_id" integer,
  	"enquiries_id" integer,
  	"packages_id" integer,
  	"destinations_id" integer,
  	"categories_id" integer,
  	"slides_id" integer,
  	"testimonials_id" integer,
  	"review_links_id" integer,
  	"posts_id" integer,
  	"post_categories_id" integer,
  	"pages_id" integer,
  	"media_id" integer,
  	"users_id" integer,
  	"message_log_id" integer,
  	"counters_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "homepage_sections" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"section" "enum_homepage_sections_section" NOT NULL,
  	"visible" boolean DEFAULT true
  );
  
  CREATE TABLE "homepage_why_us_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"text" varchar,
  	"icon" "enum_homepage_why_us_items_icon"
  );
  
  CREATE TABLE "homepage" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"why_us_eyebrow" varchar DEFAULT 'WHY CHOOSE GO TRAVELS?',
  	"why_us_heading" varchar DEFAULT 'Travel planned with care, end to end',
  	"cta_band_heading" varchar DEFAULT 'Can''t find the perfect package?',
  	"cta_band_text" varchar DEFAULT 'Tell us your dates, budget and who''s travelling. A travel expert will build a custom itinerary and send it to you on WhatsApp.',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "homepage_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"destinations_id" integer
  );
  
  CREATE TABLE "navigation_header_mega_menu_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"link_type" "enum_navigation_header_mega_menu_links_link_type" DEFAULT 'custom' NOT NULL,
  	"category_id" integer,
  	"destination_id" integer,
  	"package_id" integer,
  	"page_id" integer,
  	"url" varchar
  );
  
  CREATE TABLE "navigation_header_mega_menu" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar NOT NULL
  );
  
  CREATE TABLE "navigation_header" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"link_type" "enum_navigation_header_link_type" DEFAULT 'custom' NOT NULL,
  	"category_id" integer,
  	"destination_id" integer,
  	"package_id" integer,
  	"page_id" integer,
  	"url" varchar,
  	"featured_package_id" integer
  );
  
  CREATE TABLE "navigation_footer_quick_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"link_type" "enum_navigation_footer_quick_links_link_type" DEFAULT 'custom' NOT NULL,
  	"category_id" integer,
  	"destination_id" integer,
  	"package_id" integer,
  	"page_id" integer,
  	"url" varchar
  );
  
  CREATE TABLE "navigation_footer_tours" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"link_type" "enum_navigation_footer_tours_link_type" DEFAULT 'custom' NOT NULL,
  	"category_id" integer,
  	"destination_id" integer,
  	"package_id" integer,
  	"page_id" integer,
  	"url" varchar
  );
  
  CREATE TABLE "navigation" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "whatsapp_settings_recipients" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"phone" varchar NOT NULL,
  	"is_primary" boolean
  );
  
  CREATE TABLE "whatsapp_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"provider" "enum_whatsapp_settings_provider" DEFAULT 'gupshup' NOT NULL,
  	"api_key" varchar,
  	"api_key_hint" varchar,
  	"sender_number" varchar,
  	"connection_status" "enum_whatsapp_settings_connection_status" DEFAULT 'notConnected',
  	"send_customer_copy" boolean DEFAULT true,
  	"email_fallback" boolean DEFAULT true,
  	"fallback_email" varchar,
  	"booking_template_name" varchar,
  	"booking_template_language" varchar DEFAULT 'en',
  	"enquiry_template_name" varchar,
  	"enquiry_template_language" varchar DEFAULT 'en',
  	"customer_template_name" varchar,
  	"customer_template_language" varchar DEFAULT 'en',
  	"review_template_name" varchar,
  	"review_template_language" varchar DEFAULT 'en',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "site_settings_phones" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"number" varchar NOT NULL,
  	"label" varchar
  );
  
  CREATE TABLE "site_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"site_name" varchar DEFAULT 'Go Travels' NOT NULL,
  	"tagline" varchar DEFAULT 'Discover. Dream. Travel.',
  	"logo_id" integer,
  	"favicon_id" integer,
  	"address" varchar,
  	"whatsapp" varchar,
  	"email" varchar,
  	"working_hours" varchar DEFAULT 'Mon – Sat · 10:00 AM – 07:00 PM',
  	"map_embed_url" varchar,
  	"instagram" varchar,
  	"facebook" varchar,
  	"youtube" varchar,
  	"google_reviews" varchar,
  	"default_meta_title" varchar DEFAULT 'Go Travels — Domestic, International & Religious Tours',
  	"default_meta_description" varchar DEFAULT 'Handpicked tour packages with booking confirmed on WhatsApp.',
  	"default_og_image_id" integer,
  	"ga_id" varchar,
  	"search_console_code" varchar,
  	"sitemap_enabled" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "bookings_internal_notes" ADD CONSTRAINT "bookings_internal_notes_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "bookings_internal_notes" ADD CONSTRAINT "bookings_internal_notes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "bookings" ADD CONSTRAINT "bookings_package_id_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."packages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "bookings" ADD CONSTRAINT "bookings_assigned_to_id_users_id_fk" FOREIGN KEY ("assigned_to_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "bookings" ADD CONSTRAINT "bookings_from_enquiry_id_enquiries_id_fk" FOREIGN KEY ("from_enquiry_id") REFERENCES "public"."enquiries"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "bookings_texts" ADD CONSTRAINT "bookings_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "enquiries_internal_notes" ADD CONSTRAINT "enquiries_internal_notes_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "enquiries_internal_notes" ADD CONSTRAINT "enquiries_internal_notes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."enquiries"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "enquiries" ADD CONSTRAINT "enquiries_package_id_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."packages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "enquiries" ADD CONSTRAINT "enquiries_assigned_to_id_users_id_fk" FOREIGN KEY ("assigned_to_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "enquiries" ADD CONSTRAINT "enquiries_converted_booking_id_bookings_id_fk" FOREIGN KEY ("converted_booking_id") REFERENCES "public"."bookings"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "packages_themes" ADD CONSTRAINT "packages_themes_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."packages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "packages_itinerary" ADD CONSTRAINT "packages_itinerary_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."packages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "packages_inclusions" ADD CONSTRAINT "packages_inclusions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."packages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "packages_exclusions" ADD CONSTRAINT "packages_exclusions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."packages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "packages_hotel_options" ADD CONSTRAINT "packages_hotel_options_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."packages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "packages_add_ons" ADD CONSTRAINT "packages_add_ons_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."packages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "packages_faqs" ADD CONSTRAINT "packages_faqs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."packages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "packages" ADD CONSTRAINT "packages_destination_id_destinations_id_fk" FOREIGN KEY ("destination_id") REFERENCES "public"."destinations"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "packages" ADD CONSTRAINT "packages_seo_og_image_id_media_id_fk" FOREIGN KEY ("seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "packages_rels" ADD CONSTRAINT "packages_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."packages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "packages_rels" ADD CONSTRAINT "packages_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "packages_rels" ADD CONSTRAINT "packages_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_packages_v_version_themes" ADD CONSTRAINT "_packages_v_version_themes_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_packages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_packages_v_version_itinerary" ADD CONSTRAINT "_packages_v_version_itinerary_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_packages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_packages_v_version_inclusions" ADD CONSTRAINT "_packages_v_version_inclusions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_packages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_packages_v_version_exclusions" ADD CONSTRAINT "_packages_v_version_exclusions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_packages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_packages_v_version_hotel_options" ADD CONSTRAINT "_packages_v_version_hotel_options_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_packages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_packages_v_version_add_ons" ADD CONSTRAINT "_packages_v_version_add_ons_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_packages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_packages_v_version_faqs" ADD CONSTRAINT "_packages_v_version_faqs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_packages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_packages_v" ADD CONSTRAINT "_packages_v_parent_id_packages_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."packages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_packages_v" ADD CONSTRAINT "_packages_v_version_destination_id_destinations_id_fk" FOREIGN KEY ("version_destination_id") REFERENCES "public"."destinations"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_packages_v" ADD CONSTRAINT "_packages_v_version_seo_og_image_id_media_id_fk" FOREIGN KEY ("version_seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_packages_v_rels" ADD CONSTRAINT "_packages_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_packages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_packages_v_rels" ADD CONSTRAINT "_packages_v_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_packages_v_rels" ADD CONSTRAINT "_packages_v_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "destinations" ADD CONSTRAINT "destinations_thumbnail_id_media_id_fk" FOREIGN KEY ("thumbnail_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "destinations" ADD CONSTRAINT "destinations_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "destinations" ADD CONSTRAINT "destinations_seo_og_image_id_media_id_fk" FOREIGN KEY ("seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "categories" ADD CONSTRAINT "categories_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "categories" ADD CONSTRAINT "categories_seo_og_image_id_media_id_fk" FOREIGN KEY ("seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "categories_rels" ADD CONSTRAINT "categories_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "categories_rels" ADD CONSTRAINT "categories_rels_destinations_fk" FOREIGN KEY ("destinations_id") REFERENCES "public"."destinations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "slides" ADD CONSTRAINT "slides_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "slides" ADD CONSTRAINT "slides_destination_id_destinations_id_fk" FOREIGN KEY ("destination_id") REFERENCES "public"."destinations"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "slides" ADD CONSTRAINT "slides_package_id_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."packages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "slides" ADD CONSTRAINT "slides_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "slides" ADD CONSTRAINT "slides_image_desktop_id_media_id_fk" FOREIGN KEY ("image_desktop_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "slides" ADD CONSTRAINT "slides_image_mobile_id_media_id_fk" FOREIGN KEY ("image_mobile_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "testimonials" ADD CONSTRAINT "testimonials_package_id_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."packages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "testimonials" ADD CONSTRAINT "testimonials_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "review_links" ADD CONSTRAINT "review_links_package_id_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."packages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "review_links" ADD CONSTRAINT "review_links_testimonial_id_testimonials_id_fk" FOREIGN KEY ("testimonial_id") REFERENCES "public"."testimonials"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "posts" ADD CONSTRAINT "posts_cover_id_media_id_fk" FOREIGN KEY ("cover_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "posts" ADD CONSTRAINT "posts_seo_og_image_id_media_id_fk" FOREIGN KEY ("seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "posts" ADD CONSTRAINT "posts_category_id_post_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."post_categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "posts" ADD CONSTRAINT "posts_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_posts_v" ADD CONSTRAINT "_posts_v_parent_id_posts_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."posts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_posts_v" ADD CONSTRAINT "_posts_v_version_cover_id_media_id_fk" FOREIGN KEY ("version_cover_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_posts_v" ADD CONSTRAINT "_posts_v_version_seo_og_image_id_media_id_fk" FOREIGN KEY ("version_seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_posts_v" ADD CONSTRAINT "_posts_v_version_category_id_post_categories_id_fk" FOREIGN KEY ("version_category_id") REFERENCES "public"."post_categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_posts_v" ADD CONSTRAINT "_posts_v_version_author_id_users_id_fk" FOREIGN KEY ("version_author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_hero" ADD CONSTRAINT "pages_blocks_hero_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_hero" ADD CONSTRAINT "pages_blocks_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_rich_text" ADD CONSTRAINT "pages_blocks_rich_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_stats_items" ADD CONSTRAINT "pages_blocks_stats_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_stats"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_stats" ADD CONSTRAINT "pages_blocks_stats_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_features_items" ADD CONSTRAINT "pages_blocks_features_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_features"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_features" ADD CONSTRAINT "pages_blocks_features_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_team_members" ADD CONSTRAINT "pages_blocks_team_members_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_team_members" ADD CONSTRAINT "pages_blocks_team_members_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_team"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_team" ADD CONSTRAINT "pages_blocks_team_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_cta" ADD CONSTRAINT "pages_blocks_cta_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_cta" ADD CONSTRAINT "pages_blocks_cta_destination_id_destinations_id_fk" FOREIGN KEY ("destination_id") REFERENCES "public"."destinations"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_cta" ADD CONSTRAINT "pages_blocks_cta_package_id_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."packages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_cta" ADD CONSTRAINT "pages_blocks_cta_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_cta" ADD CONSTRAINT "pages_blocks_cta_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages" ADD CONSTRAINT "pages_seo_og_image_id_media_id_fk" FOREIGN KEY ("seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_hero" ADD CONSTRAINT "_pages_v_blocks_hero_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_hero" ADD CONSTRAINT "_pages_v_blocks_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_rich_text" ADD CONSTRAINT "_pages_v_blocks_rich_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_stats_items" ADD CONSTRAINT "_pages_v_blocks_stats_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_stats"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_stats" ADD CONSTRAINT "_pages_v_blocks_stats_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_features_items" ADD CONSTRAINT "_pages_v_blocks_features_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_features"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_features" ADD CONSTRAINT "_pages_v_blocks_features_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_team_members" ADD CONSTRAINT "_pages_v_blocks_team_members_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_team_members" ADD CONSTRAINT "_pages_v_blocks_team_members_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_team"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_team" ADD CONSTRAINT "_pages_v_blocks_team_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_cta" ADD CONSTRAINT "_pages_v_blocks_cta_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_cta" ADD CONSTRAINT "_pages_v_blocks_cta_destination_id_destinations_id_fk" FOREIGN KEY ("destination_id") REFERENCES "public"."destinations"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_cta" ADD CONSTRAINT "_pages_v_blocks_cta_package_id_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."packages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_cta" ADD CONSTRAINT "_pages_v_blocks_cta_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_cta" ADD CONSTRAINT "_pages_v_blocks_cta_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v" ADD CONSTRAINT "_pages_v_parent_id_pages_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v" ADD CONSTRAINT "_pages_v_version_seo_og_image_id_media_id_fk" FOREIGN KEY ("version_seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "message_log" ADD CONSTRAINT "message_log_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "message_log" ADD CONSTRAINT "message_log_enquiry_id_enquiries_id_fk" FOREIGN KEY ("enquiry_id") REFERENCES "public"."enquiries"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_bookings_fk" FOREIGN KEY ("bookings_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_enquiries_fk" FOREIGN KEY ("enquiries_id") REFERENCES "public"."enquiries"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_packages_fk" FOREIGN KEY ("packages_id") REFERENCES "public"."packages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_destinations_fk" FOREIGN KEY ("destinations_id") REFERENCES "public"."destinations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_slides_fk" FOREIGN KEY ("slides_id") REFERENCES "public"."slides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_testimonials_fk" FOREIGN KEY ("testimonials_id") REFERENCES "public"."testimonials"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_review_links_fk" FOREIGN KEY ("review_links_id") REFERENCES "public"."review_links"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_post_categories_fk" FOREIGN KEY ("post_categories_id") REFERENCES "public"."post_categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_message_log_fk" FOREIGN KEY ("message_log_id") REFERENCES "public"."message_log"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_counters_fk" FOREIGN KEY ("counters_id") REFERENCES "public"."counters"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_sections" ADD CONSTRAINT "homepage_sections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_why_us_items" ADD CONSTRAINT "homepage_why_us_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_rels" ADD CONSTRAINT "homepage_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_rels" ADD CONSTRAINT "homepage_rels_destinations_fk" FOREIGN KEY ("destinations_id") REFERENCES "public"."destinations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_header_mega_menu_links" ADD CONSTRAINT "navigation_header_mega_menu_links_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "navigation_header_mega_menu_links" ADD CONSTRAINT "navigation_header_mega_menu_links_destination_id_destinations_id_fk" FOREIGN KEY ("destination_id") REFERENCES "public"."destinations"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "navigation_header_mega_menu_links" ADD CONSTRAINT "navigation_header_mega_menu_links_package_id_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."packages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "navigation_header_mega_menu_links" ADD CONSTRAINT "navigation_header_mega_menu_links_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "navigation_header_mega_menu_links" ADD CONSTRAINT "navigation_header_mega_menu_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation_header_mega_menu"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_header_mega_menu" ADD CONSTRAINT "navigation_header_mega_menu_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation_header"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_header" ADD CONSTRAINT "navigation_header_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "navigation_header" ADD CONSTRAINT "navigation_header_destination_id_destinations_id_fk" FOREIGN KEY ("destination_id") REFERENCES "public"."destinations"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "navigation_header" ADD CONSTRAINT "navigation_header_package_id_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."packages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "navigation_header" ADD CONSTRAINT "navigation_header_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "navigation_header" ADD CONSTRAINT "navigation_header_featured_package_id_packages_id_fk" FOREIGN KEY ("featured_package_id") REFERENCES "public"."packages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "navigation_header" ADD CONSTRAINT "navigation_header_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_footer_quick_links" ADD CONSTRAINT "navigation_footer_quick_links_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "navigation_footer_quick_links" ADD CONSTRAINT "navigation_footer_quick_links_destination_id_destinations_id_fk" FOREIGN KEY ("destination_id") REFERENCES "public"."destinations"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "navigation_footer_quick_links" ADD CONSTRAINT "navigation_footer_quick_links_package_id_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."packages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "navigation_footer_quick_links" ADD CONSTRAINT "navigation_footer_quick_links_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "navigation_footer_quick_links" ADD CONSTRAINT "navigation_footer_quick_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_footer_tours" ADD CONSTRAINT "navigation_footer_tours_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "navigation_footer_tours" ADD CONSTRAINT "navigation_footer_tours_destination_id_destinations_id_fk" FOREIGN KEY ("destination_id") REFERENCES "public"."destinations"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "navigation_footer_tours" ADD CONSTRAINT "navigation_footer_tours_package_id_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."packages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "navigation_footer_tours" ADD CONSTRAINT "navigation_footer_tours_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "navigation_footer_tours" ADD CONSTRAINT "navigation_footer_tours_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "whatsapp_settings_recipients" ADD CONSTRAINT "whatsapp_settings_recipients_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."whatsapp_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_phones" ADD CONSTRAINT "site_settings_phones_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_favicon_id_media_id_fk" FOREIGN KEY ("favicon_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_default_og_image_id_media_id_fk" FOREIGN KEY ("default_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "bookings_internal_notes_order_idx" ON "bookings_internal_notes" USING btree ("_order");
  CREATE INDEX "bookings_internal_notes_parent_id_idx" ON "bookings_internal_notes" USING btree ("_parent_id");
  CREATE INDEX "bookings_internal_notes_author_idx" ON "bookings_internal_notes" USING btree ("author_id");
  CREATE UNIQUE INDEX "bookings_request_id_idx" ON "bookings" USING btree ("request_id");
  CREATE INDEX "bookings_package_idx" ON "bookings" USING btree ("package_id");
  CREATE INDEX "bookings_status_idx" ON "bookings" USING btree ("status");
  CREATE INDEX "bookings_assigned_to_idx" ON "bookings" USING btree ("assigned_to_id");
  CREATE INDEX "bookings_whatsapp_status_idx" ON "bookings" USING btree ("whatsapp_status");
  CREATE INDEX "bookings_from_enquiry_idx" ON "bookings" USING btree ("from_enquiry_id");
  CREATE INDEX "bookings_updated_at_idx" ON "bookings" USING btree ("updated_at");
  CREATE INDEX "bookings_created_at_idx" ON "bookings" USING btree ("created_at");
  CREATE INDEX "bookings_texts_order_parent" ON "bookings_texts" USING btree ("order","parent_id");
  CREATE INDEX "enquiries_internal_notes_order_idx" ON "enquiries_internal_notes" USING btree ("_order");
  CREATE INDEX "enquiries_internal_notes_parent_id_idx" ON "enquiries_internal_notes" USING btree ("_parent_id");
  CREATE INDEX "enquiries_internal_notes_author_idx" ON "enquiries_internal_notes" USING btree ("author_id");
  CREATE UNIQUE INDEX "enquiries_enquiry_id_idx" ON "enquiries" USING btree ("enquiry_id");
  CREATE INDEX "enquiries_package_idx" ON "enquiries" USING btree ("package_id");
  CREATE INDEX "enquiries_status_idx" ON "enquiries" USING btree ("status");
  CREATE INDEX "enquiries_assigned_to_idx" ON "enquiries" USING btree ("assigned_to_id");
  CREATE INDEX "enquiries_converted_booking_idx" ON "enquiries" USING btree ("converted_booking_id");
  CREATE INDEX "enquiries_updated_at_idx" ON "enquiries" USING btree ("updated_at");
  CREATE INDEX "enquiries_created_at_idx" ON "enquiries" USING btree ("created_at");
  CREATE INDEX "packages_themes_order_idx" ON "packages_themes" USING btree ("order");
  CREATE INDEX "packages_themes_parent_idx" ON "packages_themes" USING btree ("parent_id");
  CREATE INDEX "packages_itinerary_order_idx" ON "packages_itinerary" USING btree ("_order");
  CREATE INDEX "packages_itinerary_parent_id_idx" ON "packages_itinerary" USING btree ("_parent_id");
  CREATE INDEX "packages_inclusions_order_idx" ON "packages_inclusions" USING btree ("_order");
  CREATE INDEX "packages_inclusions_parent_id_idx" ON "packages_inclusions" USING btree ("_parent_id");
  CREATE INDEX "packages_exclusions_order_idx" ON "packages_exclusions" USING btree ("_order");
  CREATE INDEX "packages_exclusions_parent_id_idx" ON "packages_exclusions" USING btree ("_parent_id");
  CREATE INDEX "packages_hotel_options_order_idx" ON "packages_hotel_options" USING btree ("_order");
  CREATE INDEX "packages_hotel_options_parent_id_idx" ON "packages_hotel_options" USING btree ("_parent_id");
  CREATE INDEX "packages_add_ons_order_idx" ON "packages_add_ons" USING btree ("_order");
  CREATE INDEX "packages_add_ons_parent_id_idx" ON "packages_add_ons" USING btree ("_parent_id");
  CREATE INDEX "packages_faqs_order_idx" ON "packages_faqs" USING btree ("_order");
  CREATE INDEX "packages_faqs_parent_id_idx" ON "packages_faqs" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "packages_slug_idx" ON "packages" USING btree ("slug");
  CREATE UNIQUE INDEX "packages_tour_code_idx" ON "packages" USING btree ("tour_code");
  CREATE INDEX "packages_destination_idx" ON "packages" USING btree ("destination_id");
  CREATE INDEX "packages_seo_seo_og_image_idx" ON "packages" USING btree ("seo_og_image_id");
  CREATE INDEX "packages_status_idx" ON "packages" USING btree ("status");
  CREATE INDEX "packages_starting_price_idx" ON "packages" USING btree ("starting_price");
  CREATE INDEX "packages_updated_at_idx" ON "packages" USING btree ("updated_at");
  CREATE INDEX "packages_created_at_idx" ON "packages" USING btree ("created_at");
  CREATE INDEX "packages_rels_order_idx" ON "packages_rels" USING btree ("order");
  CREATE INDEX "packages_rels_parent_idx" ON "packages_rels" USING btree ("parent_id");
  CREATE INDEX "packages_rels_path_idx" ON "packages_rels" USING btree ("path");
  CREATE INDEX "packages_rels_categories_id_idx" ON "packages_rels" USING btree ("categories_id");
  CREATE INDEX "packages_rels_media_id_idx" ON "packages_rels" USING btree ("media_id");
  CREATE INDEX "_packages_v_version_themes_order_idx" ON "_packages_v_version_themes" USING btree ("order");
  CREATE INDEX "_packages_v_version_themes_parent_idx" ON "_packages_v_version_themes" USING btree ("parent_id");
  CREATE INDEX "_packages_v_version_itinerary_order_idx" ON "_packages_v_version_itinerary" USING btree ("_order");
  CREATE INDEX "_packages_v_version_itinerary_parent_id_idx" ON "_packages_v_version_itinerary" USING btree ("_parent_id");
  CREATE INDEX "_packages_v_version_inclusions_order_idx" ON "_packages_v_version_inclusions" USING btree ("_order");
  CREATE INDEX "_packages_v_version_inclusions_parent_id_idx" ON "_packages_v_version_inclusions" USING btree ("_parent_id");
  CREATE INDEX "_packages_v_version_exclusions_order_idx" ON "_packages_v_version_exclusions" USING btree ("_order");
  CREATE INDEX "_packages_v_version_exclusions_parent_id_idx" ON "_packages_v_version_exclusions" USING btree ("_parent_id");
  CREATE INDEX "_packages_v_version_hotel_options_order_idx" ON "_packages_v_version_hotel_options" USING btree ("_order");
  CREATE INDEX "_packages_v_version_hotel_options_parent_id_idx" ON "_packages_v_version_hotel_options" USING btree ("_parent_id");
  CREATE INDEX "_packages_v_version_add_ons_order_idx" ON "_packages_v_version_add_ons" USING btree ("_order");
  CREATE INDEX "_packages_v_version_add_ons_parent_id_idx" ON "_packages_v_version_add_ons" USING btree ("_parent_id");
  CREATE INDEX "_packages_v_version_faqs_order_idx" ON "_packages_v_version_faqs" USING btree ("_order");
  CREATE INDEX "_packages_v_version_faqs_parent_id_idx" ON "_packages_v_version_faqs" USING btree ("_parent_id");
  CREATE INDEX "_packages_v_parent_idx" ON "_packages_v" USING btree ("parent_id");
  CREATE INDEX "_packages_v_version_version_slug_idx" ON "_packages_v" USING btree ("version_slug");
  CREATE INDEX "_packages_v_version_version_tour_code_idx" ON "_packages_v" USING btree ("version_tour_code");
  CREATE INDEX "_packages_v_version_version_destination_idx" ON "_packages_v" USING btree ("version_destination_id");
  CREATE INDEX "_packages_v_version_seo_version_seo_og_image_idx" ON "_packages_v" USING btree ("version_seo_og_image_id");
  CREATE INDEX "_packages_v_version_version_status_idx" ON "_packages_v" USING btree ("version_status");
  CREATE INDEX "_packages_v_version_version_starting_price_idx" ON "_packages_v" USING btree ("version_starting_price");
  CREATE INDEX "_packages_v_version_version_updated_at_idx" ON "_packages_v" USING btree ("version_updated_at");
  CREATE INDEX "_packages_v_version_version_created_at_idx" ON "_packages_v" USING btree ("version_created_at");
  CREATE INDEX "_packages_v_created_at_idx" ON "_packages_v" USING btree ("created_at");
  CREATE INDEX "_packages_v_updated_at_idx" ON "_packages_v" USING btree ("updated_at");
  CREATE INDEX "_packages_v_rels_order_idx" ON "_packages_v_rels" USING btree ("order");
  CREATE INDEX "_packages_v_rels_parent_idx" ON "_packages_v_rels" USING btree ("parent_id");
  CREATE INDEX "_packages_v_rels_path_idx" ON "_packages_v_rels" USING btree ("path");
  CREATE INDEX "_packages_v_rels_categories_id_idx" ON "_packages_v_rels" USING btree ("categories_id");
  CREATE INDEX "_packages_v_rels_media_id_idx" ON "_packages_v_rels" USING btree ("media_id");
  CREATE UNIQUE INDEX "destinations_slug_idx" ON "destinations" USING btree ("slug");
  CREATE INDEX "destinations_thumbnail_idx" ON "destinations" USING btree ("thumbnail_id");
  CREATE INDEX "destinations_hero_image_idx" ON "destinations" USING btree ("hero_image_id");
  CREATE INDEX "destinations_seo_seo_og_image_idx" ON "destinations" USING btree ("seo_og_image_id");
  CREATE INDEX "destinations_updated_at_idx" ON "destinations" USING btree ("updated_at");
  CREATE INDEX "destinations_created_at_idx" ON "destinations" USING btree ("created_at");
  CREATE INDEX "categories__order_idx" ON "categories" USING btree ("_order");
  CREATE UNIQUE INDEX "categories_slug_idx" ON "categories" USING btree ("slug");
  CREATE INDEX "categories_hero_image_idx" ON "categories" USING btree ("hero_image_id");
  CREATE INDEX "categories_seo_seo_og_image_idx" ON "categories" USING btree ("seo_og_image_id");
  CREATE INDEX "categories_updated_at_idx" ON "categories" USING btree ("updated_at");
  CREATE INDEX "categories_created_at_idx" ON "categories" USING btree ("created_at");
  CREATE INDEX "categories_rels_order_idx" ON "categories_rels" USING btree ("order");
  CREATE INDEX "categories_rels_parent_idx" ON "categories_rels" USING btree ("parent_id");
  CREATE INDEX "categories_rels_path_idx" ON "categories_rels" USING btree ("path");
  CREATE INDEX "categories_rels_destinations_id_idx" ON "categories_rels" USING btree ("destinations_id");
  CREATE INDEX "slides__order_idx" ON "slides" USING btree ("_order");
  CREATE INDEX "slides_category_idx" ON "slides" USING btree ("category_id");
  CREATE INDEX "slides_destination_idx" ON "slides" USING btree ("destination_id");
  CREATE INDEX "slides_package_idx" ON "slides" USING btree ("package_id");
  CREATE INDEX "slides_page_idx" ON "slides" USING btree ("page_id");
  CREATE INDEX "slides_image_desktop_idx" ON "slides" USING btree ("image_desktop_id");
  CREATE INDEX "slides_image_mobile_idx" ON "slides" USING btree ("image_mobile_id");
  CREATE INDEX "slides_updated_at_idx" ON "slides" USING btree ("updated_at");
  CREATE INDEX "slides_created_at_idx" ON "slides" USING btree ("created_at");
  CREATE INDEX "testimonials_package_idx" ON "testimonials" USING btree ("package_id");
  CREATE INDEX "testimonials_photo_idx" ON "testimonials" USING btree ("photo_id");
  CREATE INDEX "testimonials_status_idx" ON "testimonials" USING btree ("status");
  CREATE INDEX "testimonials_updated_at_idx" ON "testimonials" USING btree ("updated_at");
  CREATE INDEX "testimonials_created_at_idx" ON "testimonials" USING btree ("created_at");
  CREATE UNIQUE INDEX "review_links_token_idx" ON "review_links" USING btree ("token");
  CREATE INDEX "review_links_package_idx" ON "review_links" USING btree ("package_id");
  CREATE INDEX "review_links_testimonial_idx" ON "review_links" USING btree ("testimonial_id");
  CREATE INDEX "review_links_updated_at_idx" ON "review_links" USING btree ("updated_at");
  CREATE INDEX "review_links_created_at_idx" ON "review_links" USING btree ("created_at");
  CREATE UNIQUE INDEX "posts_slug_idx" ON "posts" USING btree ("slug");
  CREATE INDEX "posts_cover_idx" ON "posts" USING btree ("cover_id");
  CREATE INDEX "posts_seo_seo_og_image_idx" ON "posts" USING btree ("seo_og_image_id");
  CREATE INDEX "posts_status_idx" ON "posts" USING btree ("status");
  CREATE INDEX "posts_published_at_idx" ON "posts" USING btree ("published_at");
  CREATE INDEX "posts_category_idx" ON "posts" USING btree ("category_id");
  CREATE INDEX "posts_author_idx" ON "posts" USING btree ("author_id");
  CREATE INDEX "posts_updated_at_idx" ON "posts" USING btree ("updated_at");
  CREATE INDEX "posts_created_at_idx" ON "posts" USING btree ("created_at");
  CREATE INDEX "_posts_v_parent_idx" ON "_posts_v" USING btree ("parent_id");
  CREATE INDEX "_posts_v_version_version_slug_idx" ON "_posts_v" USING btree ("version_slug");
  CREATE INDEX "_posts_v_version_version_cover_idx" ON "_posts_v" USING btree ("version_cover_id");
  CREATE INDEX "_posts_v_version_seo_version_seo_og_image_idx" ON "_posts_v" USING btree ("version_seo_og_image_id");
  CREATE INDEX "_posts_v_version_version_status_idx" ON "_posts_v" USING btree ("version_status");
  CREATE INDEX "_posts_v_version_version_published_at_idx" ON "_posts_v" USING btree ("version_published_at");
  CREATE INDEX "_posts_v_version_version_category_idx" ON "_posts_v" USING btree ("version_category_id");
  CREATE INDEX "_posts_v_version_version_author_idx" ON "_posts_v" USING btree ("version_author_id");
  CREATE INDEX "_posts_v_version_version_updated_at_idx" ON "_posts_v" USING btree ("version_updated_at");
  CREATE INDEX "_posts_v_version_version_created_at_idx" ON "_posts_v" USING btree ("version_created_at");
  CREATE INDEX "_posts_v_created_at_idx" ON "_posts_v" USING btree ("created_at");
  CREATE INDEX "_posts_v_updated_at_idx" ON "_posts_v" USING btree ("updated_at");
  CREATE UNIQUE INDEX "post_categories_slug_idx" ON "post_categories" USING btree ("slug");
  CREATE INDEX "post_categories_updated_at_idx" ON "post_categories" USING btree ("updated_at");
  CREATE INDEX "post_categories_created_at_idx" ON "post_categories" USING btree ("created_at");
  CREATE INDEX "pages_blocks_hero_order_idx" ON "pages_blocks_hero" USING btree ("_order");
  CREATE INDEX "pages_blocks_hero_parent_id_idx" ON "pages_blocks_hero" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_hero_path_idx" ON "pages_blocks_hero" USING btree ("_path");
  CREATE INDEX "pages_blocks_hero_image_idx" ON "pages_blocks_hero" USING btree ("image_id");
  CREATE INDEX "pages_blocks_rich_text_order_idx" ON "pages_blocks_rich_text" USING btree ("_order");
  CREATE INDEX "pages_blocks_rich_text_parent_id_idx" ON "pages_blocks_rich_text" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_rich_text_path_idx" ON "pages_blocks_rich_text" USING btree ("_path");
  CREATE INDEX "pages_blocks_stats_items_order_idx" ON "pages_blocks_stats_items" USING btree ("_order");
  CREATE INDEX "pages_blocks_stats_items_parent_id_idx" ON "pages_blocks_stats_items" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_stats_order_idx" ON "pages_blocks_stats" USING btree ("_order");
  CREATE INDEX "pages_blocks_stats_parent_id_idx" ON "pages_blocks_stats" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_stats_path_idx" ON "pages_blocks_stats" USING btree ("_path");
  CREATE INDEX "pages_blocks_features_items_order_idx" ON "pages_blocks_features_items" USING btree ("_order");
  CREATE INDEX "pages_blocks_features_items_parent_id_idx" ON "pages_blocks_features_items" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_features_order_idx" ON "pages_blocks_features" USING btree ("_order");
  CREATE INDEX "pages_blocks_features_parent_id_idx" ON "pages_blocks_features" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_features_path_idx" ON "pages_blocks_features" USING btree ("_path");
  CREATE INDEX "pages_blocks_team_members_order_idx" ON "pages_blocks_team_members" USING btree ("_order");
  CREATE INDEX "pages_blocks_team_members_parent_id_idx" ON "pages_blocks_team_members" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_team_members_photo_idx" ON "pages_blocks_team_members" USING btree ("photo_id");
  CREATE INDEX "pages_blocks_team_order_idx" ON "pages_blocks_team" USING btree ("_order");
  CREATE INDEX "pages_blocks_team_parent_id_idx" ON "pages_blocks_team" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_team_path_idx" ON "pages_blocks_team" USING btree ("_path");
  CREATE INDEX "pages_blocks_cta_order_idx" ON "pages_blocks_cta" USING btree ("_order");
  CREATE INDEX "pages_blocks_cta_parent_id_idx" ON "pages_blocks_cta" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_cta_path_idx" ON "pages_blocks_cta" USING btree ("_path");
  CREATE INDEX "pages_blocks_cta_category_idx" ON "pages_blocks_cta" USING btree ("category_id");
  CREATE INDEX "pages_blocks_cta_destination_idx" ON "pages_blocks_cta" USING btree ("destination_id");
  CREATE INDEX "pages_blocks_cta_package_idx" ON "pages_blocks_cta" USING btree ("package_id");
  CREATE INDEX "pages_blocks_cta_page_idx" ON "pages_blocks_cta" USING btree ("page_id");
  CREATE UNIQUE INDEX "pages_slug_idx" ON "pages" USING btree ("slug");
  CREATE INDEX "pages_seo_seo_og_image_idx" ON "pages" USING btree ("seo_og_image_id");
  CREATE INDEX "pages_updated_at_idx" ON "pages" USING btree ("updated_at");
  CREATE INDEX "pages_created_at_idx" ON "pages" USING btree ("created_at");
  CREATE INDEX "_pages_v_blocks_hero_order_idx" ON "_pages_v_blocks_hero" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_hero_parent_id_idx" ON "_pages_v_blocks_hero" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_hero_path_idx" ON "_pages_v_blocks_hero" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_hero_image_idx" ON "_pages_v_blocks_hero" USING btree ("image_id");
  CREATE INDEX "_pages_v_blocks_rich_text_order_idx" ON "_pages_v_blocks_rich_text" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_rich_text_parent_id_idx" ON "_pages_v_blocks_rich_text" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_rich_text_path_idx" ON "_pages_v_blocks_rich_text" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_stats_items_order_idx" ON "_pages_v_blocks_stats_items" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_stats_items_parent_id_idx" ON "_pages_v_blocks_stats_items" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_stats_order_idx" ON "_pages_v_blocks_stats" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_stats_parent_id_idx" ON "_pages_v_blocks_stats" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_stats_path_idx" ON "_pages_v_blocks_stats" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_features_items_order_idx" ON "_pages_v_blocks_features_items" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_features_items_parent_id_idx" ON "_pages_v_blocks_features_items" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_features_order_idx" ON "_pages_v_blocks_features" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_features_parent_id_idx" ON "_pages_v_blocks_features" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_features_path_idx" ON "_pages_v_blocks_features" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_team_members_order_idx" ON "_pages_v_blocks_team_members" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_team_members_parent_id_idx" ON "_pages_v_blocks_team_members" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_team_members_photo_idx" ON "_pages_v_blocks_team_members" USING btree ("photo_id");
  CREATE INDEX "_pages_v_blocks_team_order_idx" ON "_pages_v_blocks_team" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_team_parent_id_idx" ON "_pages_v_blocks_team" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_team_path_idx" ON "_pages_v_blocks_team" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_cta_order_idx" ON "_pages_v_blocks_cta" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_cta_parent_id_idx" ON "_pages_v_blocks_cta" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_cta_path_idx" ON "_pages_v_blocks_cta" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_cta_category_idx" ON "_pages_v_blocks_cta" USING btree ("category_id");
  CREATE INDEX "_pages_v_blocks_cta_destination_idx" ON "_pages_v_blocks_cta" USING btree ("destination_id");
  CREATE INDEX "_pages_v_blocks_cta_package_idx" ON "_pages_v_blocks_cta" USING btree ("package_id");
  CREATE INDEX "_pages_v_blocks_cta_page_idx" ON "_pages_v_blocks_cta" USING btree ("page_id");
  CREATE INDEX "_pages_v_parent_idx" ON "_pages_v" USING btree ("parent_id");
  CREATE INDEX "_pages_v_version_version_slug_idx" ON "_pages_v" USING btree ("version_slug");
  CREATE INDEX "_pages_v_version_seo_version_seo_og_image_idx" ON "_pages_v" USING btree ("version_seo_og_image_id");
  CREATE INDEX "_pages_v_version_version_updated_at_idx" ON "_pages_v" USING btree ("version_updated_at");
  CREATE INDEX "_pages_v_version_version_created_at_idx" ON "_pages_v" USING btree ("version_created_at");
  CREATE INDEX "_pages_v_created_at_idx" ON "_pages_v" USING btree ("created_at");
  CREATE INDEX "_pages_v_updated_at_idx" ON "_pages_v" USING btree ("updated_at");
  CREATE INDEX "media_folder_idx" ON "media" USING btree ("folder");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE INDEX "media_sizes_thumbnail_sizes_thumbnail_filename_idx" ON "media" USING btree ("sizes_thumbnail_filename");
  CREATE INDEX "media_sizes_card_sizes_card_filename_idx" ON "media" USING btree ("sizes_card_filename");
  CREATE INDEX "media_sizes_hero_sizes_hero_filename_idx" ON "media" USING btree ("sizes_hero_filename");
  CREATE INDEX "media_sizes_hero_mobile_sizes_hero_mobile_filename_idx" ON "media" USING btree ("sizes_hero_mobile_filename");
  CREATE INDEX "media_sizes_og_sizes_og_filename_idx" ON "media" USING btree ("sizes_og_filename");
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE INDEX "message_log_reference_idx" ON "message_log" USING btree ("reference");
  CREATE INDEX "message_log_booking_idx" ON "message_log" USING btree ("booking_id");
  CREATE INDEX "message_log_enquiry_idx" ON "message_log" USING btree ("enquiry_id");
  CREATE INDEX "message_log_provider_message_id_idx" ON "message_log" USING btree ("provider_message_id");
  CREATE INDEX "message_log_status_idx" ON "message_log" USING btree ("status");
  CREATE INDEX "message_log_updated_at_idx" ON "message_log" USING btree ("updated_at");
  CREATE INDEX "message_log_created_at_idx" ON "message_log" USING btree ("created_at");
  CREATE UNIQUE INDEX "counters_key_idx" ON "counters" USING btree ("key");
  CREATE INDEX "counters_updated_at_idx" ON "counters" USING btree ("updated_at");
  CREATE INDEX "counters_created_at_idx" ON "counters" USING btree ("created_at");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_bookings_id_idx" ON "payload_locked_documents_rels" USING btree ("bookings_id");
  CREATE INDEX "payload_locked_documents_rels_enquiries_id_idx" ON "payload_locked_documents_rels" USING btree ("enquiries_id");
  CREATE INDEX "payload_locked_documents_rels_packages_id_idx" ON "payload_locked_documents_rels" USING btree ("packages_id");
  CREATE INDEX "payload_locked_documents_rels_destinations_id_idx" ON "payload_locked_documents_rels" USING btree ("destinations_id");
  CREATE INDEX "payload_locked_documents_rels_categories_id_idx" ON "payload_locked_documents_rels" USING btree ("categories_id");
  CREATE INDEX "payload_locked_documents_rels_slides_id_idx" ON "payload_locked_documents_rels" USING btree ("slides_id");
  CREATE INDEX "payload_locked_documents_rels_testimonials_id_idx" ON "payload_locked_documents_rels" USING btree ("testimonials_id");
  CREATE INDEX "payload_locked_documents_rels_review_links_id_idx" ON "payload_locked_documents_rels" USING btree ("review_links_id");
  CREATE INDEX "payload_locked_documents_rels_posts_id_idx" ON "payload_locked_documents_rels" USING btree ("posts_id");
  CREATE INDEX "payload_locked_documents_rels_post_categories_id_idx" ON "payload_locked_documents_rels" USING btree ("post_categories_id");
  CREATE INDEX "payload_locked_documents_rels_pages_id_idx" ON "payload_locked_documents_rels" USING btree ("pages_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_message_log_id_idx" ON "payload_locked_documents_rels" USING btree ("message_log_id");
  CREATE INDEX "payload_locked_documents_rels_counters_id_idx" ON "payload_locked_documents_rels" USING btree ("counters_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");
  CREATE INDEX "homepage_sections_order_idx" ON "homepage_sections" USING btree ("_order");
  CREATE INDEX "homepage_sections_parent_id_idx" ON "homepage_sections" USING btree ("_parent_id");
  CREATE INDEX "homepage_why_us_items_order_idx" ON "homepage_why_us_items" USING btree ("_order");
  CREATE INDEX "homepage_why_us_items_parent_id_idx" ON "homepage_why_us_items" USING btree ("_parent_id");
  CREATE INDEX "homepage_rels_order_idx" ON "homepage_rels" USING btree ("order");
  CREATE INDEX "homepage_rels_parent_idx" ON "homepage_rels" USING btree ("parent_id");
  CREATE INDEX "homepage_rels_path_idx" ON "homepage_rels" USING btree ("path");
  CREATE INDEX "homepage_rels_destinations_id_idx" ON "homepage_rels" USING btree ("destinations_id");
  CREATE INDEX "navigation_header_mega_menu_links_order_idx" ON "navigation_header_mega_menu_links" USING btree ("_order");
  CREATE INDEX "navigation_header_mega_menu_links_parent_id_idx" ON "navigation_header_mega_menu_links" USING btree ("_parent_id");
  CREATE INDEX "navigation_header_mega_menu_links_category_idx" ON "navigation_header_mega_menu_links" USING btree ("category_id");
  CREATE INDEX "navigation_header_mega_menu_links_destination_idx" ON "navigation_header_mega_menu_links" USING btree ("destination_id");
  CREATE INDEX "navigation_header_mega_menu_links_package_idx" ON "navigation_header_mega_menu_links" USING btree ("package_id");
  CREATE INDEX "navigation_header_mega_menu_links_page_idx" ON "navigation_header_mega_menu_links" USING btree ("page_id");
  CREATE INDEX "navigation_header_mega_menu_order_idx" ON "navigation_header_mega_menu" USING btree ("_order");
  CREATE INDEX "navigation_header_mega_menu_parent_id_idx" ON "navigation_header_mega_menu" USING btree ("_parent_id");
  CREATE INDEX "navigation_header_order_idx" ON "navigation_header" USING btree ("_order");
  CREATE INDEX "navigation_header_parent_id_idx" ON "navigation_header" USING btree ("_parent_id");
  CREATE INDEX "navigation_header_category_idx" ON "navigation_header" USING btree ("category_id");
  CREATE INDEX "navigation_header_destination_idx" ON "navigation_header" USING btree ("destination_id");
  CREATE INDEX "navigation_header_package_idx" ON "navigation_header" USING btree ("package_id");
  CREATE INDEX "navigation_header_page_idx" ON "navigation_header" USING btree ("page_id");
  CREATE INDEX "navigation_header_featured_package_idx" ON "navigation_header" USING btree ("featured_package_id");
  CREATE INDEX "navigation_footer_quick_links_order_idx" ON "navigation_footer_quick_links" USING btree ("_order");
  CREATE INDEX "navigation_footer_quick_links_parent_id_idx" ON "navigation_footer_quick_links" USING btree ("_parent_id");
  CREATE INDEX "navigation_footer_quick_links_category_idx" ON "navigation_footer_quick_links" USING btree ("category_id");
  CREATE INDEX "navigation_footer_quick_links_destination_idx" ON "navigation_footer_quick_links" USING btree ("destination_id");
  CREATE INDEX "navigation_footer_quick_links_package_idx" ON "navigation_footer_quick_links" USING btree ("package_id");
  CREATE INDEX "navigation_footer_quick_links_page_idx" ON "navigation_footer_quick_links" USING btree ("page_id");
  CREATE INDEX "navigation_footer_tours_order_idx" ON "navigation_footer_tours" USING btree ("_order");
  CREATE INDEX "navigation_footer_tours_parent_id_idx" ON "navigation_footer_tours" USING btree ("_parent_id");
  CREATE INDEX "navigation_footer_tours_category_idx" ON "navigation_footer_tours" USING btree ("category_id");
  CREATE INDEX "navigation_footer_tours_destination_idx" ON "navigation_footer_tours" USING btree ("destination_id");
  CREATE INDEX "navigation_footer_tours_package_idx" ON "navigation_footer_tours" USING btree ("package_id");
  CREATE INDEX "navigation_footer_tours_page_idx" ON "navigation_footer_tours" USING btree ("page_id");
  CREATE INDEX "whatsapp_settings_recipients_order_idx" ON "whatsapp_settings_recipients" USING btree ("_order");
  CREATE INDEX "whatsapp_settings_recipients_parent_id_idx" ON "whatsapp_settings_recipients" USING btree ("_parent_id");
  CREATE INDEX "site_settings_phones_order_idx" ON "site_settings_phones" USING btree ("_order");
  CREATE INDEX "site_settings_phones_parent_id_idx" ON "site_settings_phones" USING btree ("_parent_id");
  CREATE INDEX "site_settings_logo_idx" ON "site_settings" USING btree ("logo_id");
  CREATE INDEX "site_settings_favicon_idx" ON "site_settings" USING btree ("favicon_id");
  CREATE INDEX "site_settings_default_og_image_idx" ON "site_settings" USING btree ("default_og_image_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "bookings_internal_notes" CASCADE;
  DROP TABLE "bookings" CASCADE;
  DROP TABLE "bookings_texts" CASCADE;
  DROP TABLE "enquiries_internal_notes" CASCADE;
  DROP TABLE "enquiries" CASCADE;
  DROP TABLE "packages_themes" CASCADE;
  DROP TABLE "packages_itinerary" CASCADE;
  DROP TABLE "packages_inclusions" CASCADE;
  DROP TABLE "packages_exclusions" CASCADE;
  DROP TABLE "packages_hotel_options" CASCADE;
  DROP TABLE "packages_add_ons" CASCADE;
  DROP TABLE "packages_faqs" CASCADE;
  DROP TABLE "packages" CASCADE;
  DROP TABLE "packages_rels" CASCADE;
  DROP TABLE "_packages_v_version_themes" CASCADE;
  DROP TABLE "_packages_v_version_itinerary" CASCADE;
  DROP TABLE "_packages_v_version_inclusions" CASCADE;
  DROP TABLE "_packages_v_version_exclusions" CASCADE;
  DROP TABLE "_packages_v_version_hotel_options" CASCADE;
  DROP TABLE "_packages_v_version_add_ons" CASCADE;
  DROP TABLE "_packages_v_version_faqs" CASCADE;
  DROP TABLE "_packages_v" CASCADE;
  DROP TABLE "_packages_v_rels" CASCADE;
  DROP TABLE "destinations" CASCADE;
  DROP TABLE "categories" CASCADE;
  DROP TABLE "categories_rels" CASCADE;
  DROP TABLE "slides" CASCADE;
  DROP TABLE "testimonials" CASCADE;
  DROP TABLE "review_links" CASCADE;
  DROP TABLE "posts" CASCADE;
  DROP TABLE "_posts_v" CASCADE;
  DROP TABLE "post_categories" CASCADE;
  DROP TABLE "pages_blocks_hero" CASCADE;
  DROP TABLE "pages_blocks_rich_text" CASCADE;
  DROP TABLE "pages_blocks_stats_items" CASCADE;
  DROP TABLE "pages_blocks_stats" CASCADE;
  DROP TABLE "pages_blocks_features_items" CASCADE;
  DROP TABLE "pages_blocks_features" CASCADE;
  DROP TABLE "pages_blocks_team_members" CASCADE;
  DROP TABLE "pages_blocks_team" CASCADE;
  DROP TABLE "pages_blocks_cta" CASCADE;
  DROP TABLE "pages" CASCADE;
  DROP TABLE "_pages_v_blocks_hero" CASCADE;
  DROP TABLE "_pages_v_blocks_rich_text" CASCADE;
  DROP TABLE "_pages_v_blocks_stats_items" CASCADE;
  DROP TABLE "_pages_v_blocks_stats" CASCADE;
  DROP TABLE "_pages_v_blocks_features_items" CASCADE;
  DROP TABLE "_pages_v_blocks_features" CASCADE;
  DROP TABLE "_pages_v_blocks_team_members" CASCADE;
  DROP TABLE "_pages_v_blocks_team" CASCADE;
  DROP TABLE "_pages_v_blocks_cta" CASCADE;
  DROP TABLE "_pages_v" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "message_log" CASCADE;
  DROP TABLE "counters" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TABLE "homepage_sections" CASCADE;
  DROP TABLE "homepage_why_us_items" CASCADE;
  DROP TABLE "homepage" CASCADE;
  DROP TABLE "homepage_rels" CASCADE;
  DROP TABLE "navigation_header_mega_menu_links" CASCADE;
  DROP TABLE "navigation_header_mega_menu" CASCADE;
  DROP TABLE "navigation_header" CASCADE;
  DROP TABLE "navigation_footer_quick_links" CASCADE;
  DROP TABLE "navigation_footer_tours" CASCADE;
  DROP TABLE "navigation" CASCADE;
  DROP TABLE "whatsapp_settings_recipients" CASCADE;
  DROP TABLE "whatsapp_settings" CASCADE;
  DROP TABLE "site_settings_phones" CASCADE;
  DROP TABLE "site_settings" CASCADE;
  DROP TYPE "public"."enum_bookings_hotel_category";
  DROP TYPE "public"."enum_bookings_status";
  DROP TYPE "public"."enum_bookings_whatsapp_status";
  DROP TYPE "public"."enum_bookings_source";
  DROP TYPE "public"."enum_enquiries_trip_type";
  DROP TYPE "public"."enum_enquiries_travellers";
  DROP TYPE "public"."enum_enquiries_budget";
  DROP TYPE "public"."enum_enquiries_status";
  DROP TYPE "public"."enum_enquiries_source";
  DROP TYPE "public"."enum_enquiries_whatsapp_status";
  DROP TYPE "public"."enum_packages_themes";
  DROP TYPE "public"."enum_packages_hotel_options_category";
  DROP TYPE "public"."enum_packages_status";
  DROP TYPE "public"."enum_packages_badge";
  DROP TYPE "public"."enum__packages_v_version_themes";
  DROP TYPE "public"."enum__packages_v_version_hotel_options_category";
  DROP TYPE "public"."enum__packages_v_version_status";
  DROP TYPE "public"."enum__packages_v_version_badge";
  DROP TYPE "public"."enum_destinations_tone";
  DROP TYPE "public"."enum_categories_colour";
  DROP TYPE "public"."enum_slides_link_type";
  DROP TYPE "public"."enum_testimonials_status";
  DROP TYPE "public"."enum_testimonials_source";
  DROP TYPE "public"."enum_posts_status";
  DROP TYPE "public"."enum__posts_v_version_status";
  DROP TYPE "public"."enum_pages_blocks_cta_link_type";
  DROP TYPE "public"."enum_pages_status";
  DROP TYPE "public"."enum__pages_v_blocks_cta_link_type";
  DROP TYPE "public"."enum__pages_v_version_status";
  DROP TYPE "public"."enum_media_folder";
  DROP TYPE "public"."enum_users_role";
  DROP TYPE "public"."enum_users_whatsapp_alerts";
  DROP TYPE "public"."enum_users_status";
  DROP TYPE "public"."enum_message_log_kind";
  DROP TYPE "public"."enum_message_log_provider";
  DROP TYPE "public"."enum_message_log_status";
  DROP TYPE "public"."enum_homepage_sections_section";
  DROP TYPE "public"."enum_homepage_why_us_items_icon";
  DROP TYPE "public"."enum_navigation_header_mega_menu_links_link_type";
  DROP TYPE "public"."enum_navigation_header_link_type";
  DROP TYPE "public"."enum_navigation_footer_quick_links_link_type";
  DROP TYPE "public"."enum_navigation_footer_tours_link_type";
  DROP TYPE "public"."enum_whatsapp_settings_provider";
  DROP TYPE "public"."enum_whatsapp_settings_connection_status";`)
}
