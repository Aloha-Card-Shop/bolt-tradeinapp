/*
  # Add categories and groups tables

  1. New Tables
    - `categories`
      - `category_id` (integer, primary key)
      - `name` (text)
      - Various metadata fields
    - `groups`
      - `groupid` (integer, primary key)
      - `name` (text)
      - `categoryid` (integer, references categories)
      - Various metadata fields

  2. Security
    - No RLS needed as these are read-only reference tables
*/

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  category_id integer PRIMARY KEY,
  name text NOT NULL,
  modified_on timestamptz DEFAULT now() NOT NULL,
  display_name text,
  seo_category_name text,
  category_description text,
  category_page_title text,
  sealed_label text,
  non_sealed_label text,
  condition_guide_url text,
  is_scannable boolean,
  popularity integer,
  is_direct boolean
);

-- Create groups table
CREATE TABLE IF NOT EXISTS groups (
  groupid integer PRIMARY KEY,
  name text NOT NULL,
  abbreviation text,
  issupplemental boolean NOT NULL,
  publishedon timestamptz NOT NULL,
  modifiedon timestamptz NOT NULL,
  categoryid integer NOT NULL REFERENCES categories(category_id)
);