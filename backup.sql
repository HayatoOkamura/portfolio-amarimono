--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: ingredient_genres; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ingredient_genres (
    id integer NOT NULL,
    name character varying(50) NOT NULL
);


ALTER TABLE public.ingredient_genres OWNER TO postgres;

--
-- Name: ingredient_genres_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ingredient_genres_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ingredient_genres_id_seq OWNER TO postgres;

--
-- Name: ingredient_genres_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ingredient_genres_id_seq OWNED BY public.ingredient_genres.id;


--
-- Name: ingredients; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ingredients (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    image_url text,
    quantity integer NOT NULL,
    unit_id integer,
    genre_id integer
);


ALTER TABLE public.ingredients OWNER TO postgres;

--
-- Name: ingredients_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ingredients_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ingredients_id_seq OWNER TO postgres;

--
-- Name: ingredients_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ingredients_id_seq OWNED BY public.ingredients.id;


--
-- Name: likes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.likes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    recipe_id uuid NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.likes OWNER TO postgres;

--
-- Name: nutrition_standards; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.nutrition_standards (
    id integer NOT NULL,
    age_group character varying(50) NOT NULL,
    gender character varying(10) NOT NULL,
    calories double precision NOT NULL,
    protein double precision NOT NULL,
    fat double precision NOT NULL,
    carbohydrates double precision NOT NULL,
    sugar double precision NOT NULL,
    salt double precision NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.nutrition_standards OWNER TO postgres;

--
-- Name: nutritionstandard_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.nutritionstandard_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.nutritionstandard_id_seq OWNER TO postgres;

--
-- Name: nutritionstandard_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.nutritionstandard_id_seq OWNED BY public.nutrition_standards.id;


--
-- Name: recipe_genres; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.recipe_genres (
    id integer NOT NULL,
    name character varying(50) NOT NULL
);


ALTER TABLE public.recipe_genres OWNER TO postgres;

--
-- Name: recipe_genres_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.recipe_genres_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.recipe_genres_id_seq OWNER TO postgres;

--
-- Name: recipe_genres_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.recipe_genres_id_seq OWNED BY public.recipe_genres.id;


--
-- Name: recipe_ingredients; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.recipe_ingredients (
    ingredient_id integer NOT NULL,
    quantity_required integer NOT NULL,
    recipe_id uuid
);


ALTER TABLE public.recipe_ingredients OWNER TO postgres;

--
-- Name: recipes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.recipes (
    name character varying(100) NOT NULL,
    image_url text,
    genre_id integer,
    instructions jsonb NOT NULL,
    cooking_time integer,
    reviews numeric(2,1) DEFAULT 0,
    cost_estimate text,
    summary text,
    nutrition jsonb,
    faq jsonb,
    catchphrase text,
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid,
    is_public boolean DEFAULT false
);


ALTER TABLE public.recipes OWNER TO postgres;

--
-- Name: schema_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.schema_migrations (
    version bigint NOT NULL,
    dirty boolean NOT NULL
);


ALTER TABLE public.schema_migrations OWNER TO postgres;

--
-- Name: units; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.units (
    id integer NOT NULL,
    name character varying(20) NOT NULL,
    description character varying(100),
    step integer DEFAULT 1 NOT NULL
);


ALTER TABLE public.units OWNER TO postgres;

--
-- Name: units_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.units_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.units_id_seq OWNER TO postgres;

--
-- Name: units_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.units_id_seq OWNED BY public.units.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email text NOT NULL,
    username character varying(255),
    profile_image text,
    age integer,
    gender character varying(20)
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: ingredient_genres id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ingredient_genres ALTER COLUMN id SET DEFAULT nextval('public.ingredient_genres_id_seq'::regclass);


--
-- Name: ingredients id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ingredients ALTER COLUMN id SET DEFAULT nextval('public.ingredients_id_seq'::regclass);


--
-- Name: nutrition_standards id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nutrition_standards ALTER COLUMN id SET DEFAULT nextval('public.nutritionstandard_id_seq'::regclass);


--
-- Name: recipe_genres id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recipe_genres ALTER COLUMN id SET DEFAULT nextval('public.recipe_genres_id_seq'::regclass);


--
-- Name: units id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.units ALTER COLUMN id SET DEFAULT nextval('public.units_id_seq'::regclass);


--
-- Data for Name: ingredient_genres; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ingredient_genres (id, name) FROM stdin;
1	野菜
2	肉
3	魚介
4	主食・粉
5	調味料
6	スパイス
7	卵・乳・豆
8	デザート
9	その他
\.


--
-- Data for Name: ingredients; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ingredients (id, name, image_url, quantity, unit_id, genre_id) FROM stdin;
6	test01	uploads/recipe/1740827444818314462-名称未設定のデザイン (4).png	0	5	1
7	test02	uploads/recipe/1740827457230752509-名称未設定のデザイン (4).png	0	20	8
\.


--
-- Data for Name: likes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.likes (id, user_id, recipe_id, created_at) FROM stdin;
\.


--
-- Data for Name: nutrition_standards; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.nutrition_standards (id, age_group, gender, calories, protein, fat, carbohydrates, sugar, salt, created_at, updated_at) FROM stdin;
1	18-29	male	2650	60	70	360	50	7.5	2025-02-25 22:59:49.542434+00	2025-02-25 22:59:49.542434+00
\.


--
-- Data for Name: recipe_genres; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.recipe_genres (id, name) FROM stdin;
1	主菜
2	副菜
3	汁物
4	ご飯物
5	デザート
6	旬魚・あじ
7	旬野菜・きゅうり
8	その他
9	その他
\.


--
-- Data for Name: recipe_ingredients; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.recipe_ingredients (ingredient_id, quantity_required, recipe_id) FROM stdin;
6	2	eb23806c-9957-4a11-b8d0-91a60fd20106
7	3	eb23806c-9957-4a11-b8d0-91a60fd20106
6	2	3f08c9fa-595f-494d-a099-0df62fcb1777
7	2	3f08c9fa-595f-494d-a099-0df62fcb1777
\.


--
-- Data for Name: recipes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.recipes (name, image_url, genre_id, instructions, cooking_time, reviews, cost_estimate, summary, nutrition, faq, catchphrase, id, user_id, is_public) FROM stdin;
test01	test01/1740845138413611716-名称未設定のデザイン (5).png	5	[{"image_url": "test01/instructions/1740845138219049508-名称未設定のデザイン (2).png", "stepNumber": 1, "description": "test01"}]	25	0.0	test01	test01	{"fat": 0, "salt": 0, "sugar": 2, "protein": 0, "calories": 0, "carbohydrates": 0}	[{"answer": "test01", "question": "test01"}]	test01	eb23806c-9957-4a11-b8d0-91a60fd20106	\N	t
test02	test02/1740882168362827876-名称未設定のデザイン (3).png	4	[{"image_url": "test02/instructions/1740882168278677251-名称未設定のデザイン (3).png", "stepNumber": 1, "description": "test02"}]	25	0.0	test02	test02	{"fat": 0, "salt": 0, "sugar": 0, "protein": 0, "calories": 3, "carbohydrates": 0}	[{"answer": "test02", "question": "test02"}]	test02	3f08c9fa-595f-494d-a099-0df62fcb1777	\N	t
\.


--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.schema_migrations (version, dirty) FROM stdin;
5	f
\.


--
-- Data for Name: units; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.units (id, name, description, step) FROM stdin;
5	個	個数	1
6	枚	枚数	1
7	本	本数	1
8	房	房	1
9	パック	パック	1
10	袋	袋	1
11	束	束	1
12	株	株	1
13	缶	缶	1
14	切れ	切れ	1
15	尾	尾	1
16	杯	杯	1
17	玉	玉	1
18	丁	丁	1
19	瓶	瓶	1
1	g	グラム	50
3	ml	ミリリットル	50
2	kg	キログラム	1000
4	l	リットル	1000
20	大さじ	大さじ	1
21	小さじ	小さじ	1
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, email, username, profile_image, age, gender) FROM stdin;
40af3740-621f-4925-bcce-2161ca06f45c	keepsmile.lucky7@gmail.com	隼斗	http://localhost:8080/uploads/user/1740705961701413258-名称未設定のデザイン (1).jpg	23	male
\.


--
-- Name: ingredient_genres_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ingredient_genres_id_seq', 15, true);


--
-- Name: ingredients_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ingredients_id_seq', 7, true);


--
-- Name: nutritionstandard_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.nutritionstandard_id_seq', 1, true);


--
-- Name: recipe_genres_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.recipe_genres_id_seq', 9, true);


--
-- Name: units_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.units_id_seq', 21, true);


--
-- Name: ingredient_genres ingredient_genres_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ingredient_genres
    ADD CONSTRAINT ingredient_genres_pkey PRIMARY KEY (id);


--
-- Name: ingredients ingredients_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ingredients
    ADD CONSTRAINT ingredients_pkey PRIMARY KEY (id);


--
-- Name: likes likes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.likes
    ADD CONSTRAINT likes_pkey PRIMARY KEY (id);


--
-- Name: nutrition_standards nutritionstandard_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nutrition_standards
    ADD CONSTRAINT nutritionstandard_pkey PRIMARY KEY (id);


--
-- Name: recipe_genres recipe_genres_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recipe_genres
    ADD CONSTRAINT recipe_genres_pkey PRIMARY KEY (id);


--
-- Name: recipes recipes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recipes
    ADD CONSTRAINT recipes_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: likes unique_user_recipe; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.likes
    ADD CONSTRAINT unique_user_recipe UNIQUE (user_id, recipe_id);


--
-- Name: units units_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.units
    ADD CONSTRAINT units_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: likes fk_likes_recipe; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.likes
    ADD CONSTRAINT fk_likes_recipe FOREIGN KEY (recipe_id) REFERENCES public.recipes(id) ON DELETE CASCADE;


--
-- Name: likes fk_likes_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.likes
    ADD CONSTRAINT fk_likes_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: recipes fk_recipes_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recipes
    ADD CONSTRAINT fk_recipes_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: ingredients ingredients_genre_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ingredients
    ADD CONSTRAINT ingredients_genre_id_fkey FOREIGN KEY (genre_id) REFERENCES public.ingredient_genres(id) ON DELETE SET NULL;


--
-- Name: ingredients ingredients_unit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ingredients
    ADD CONSTRAINT ingredients_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES public.units(id) ON DELETE SET NULL;


--
-- Name: recipe_ingredients recipe_ingredients_ingredient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recipe_ingredients
    ADD CONSTRAINT recipe_ingredients_ingredient_id_fkey FOREIGN KEY (ingredient_id) REFERENCES public.ingredients(id) ON DELETE CASCADE;


--
-- Name: recipe_ingredients recipe_ingredients_recipe_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recipe_ingredients
    ADD CONSTRAINT recipe_ingredients_recipe_id_fkey FOREIGN KEY (recipe_id) REFERENCES public.recipes(id) ON DELETE CASCADE;


--
-- Name: recipes recipes_genre_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recipes
    ADD CONSTRAINT recipes_genre_id_fkey FOREIGN KEY (genre_id) REFERENCES public.recipe_genres(id) ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

