--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4 (Homebrew)

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
    genre_id integer,
    image_url text,
    unit_id integer
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
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    recipe_id uuid NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.likes OWNER TO postgres;

--
-- Name: nutrition_standards; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.nutrition_standards (
    age_group character varying(50) NOT NULL,
    gender character varying(10) NOT NULL,
    calories double precision NOT NULL,
    protein double precision NOT NULL,
    fat double precision NOT NULL,
    carbohydrates double precision NOT NULL,
    sugar double precision NOT NULL,
    salt double precision NOT NULL
);


ALTER TABLE public.nutrition_standards OWNER TO postgres;

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
    recipe_id uuid NOT NULL,
    ingredient_id integer NOT NULL,
    quantity_required double precision NOT NULL
);


ALTER TABLE public.recipe_ingredients OWNER TO postgres;

--
-- Name: recipes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.recipes (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(100) NOT NULL,
    image_url text,
    genre_id integer,
    instructions jsonb NOT NULL,
    cooking_time integer,
    cost_estimate integer,
    summary text,
    nutrition jsonb,
    catchphrase text,
    faq jsonb DEFAULT '[]'::jsonb,
    user_id uuid,
    is_public boolean DEFAULT true,
    is_draft boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.recipes OWNER TO postgres;

--
-- Name: reviews; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reviews (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    recipe_id uuid NOT NULL,
    user_id uuid NOT NULL,
    rating integer,
    comment text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT reviews_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);


ALTER TABLE public.reviews OWNER TO postgres;

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
    step numeric DEFAULT 1 NOT NULL
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
-- Name: user_ingredient_defaults; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_ingredient_defaults (
    user_id uuid NOT NULL,
    ingredient_id integer NOT NULL,
    default_quantity integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.user_ingredient_defaults OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid NOT NULL,
    email character varying(255),
    username character varying(255),
    profile_image text,
    age character varying(50),
    gender character varying(10)
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
4	穀物
5	乳製品
6	調味料
7	果物
8	豆類
9	卵
10	海藻
11	その他
\.


--
-- Data for Name: ingredients; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ingredients (id, name, genre_id, image_url, unit_id) FROM stdin;
62	test01	4	ingredients/1745551794318008418-名称未設定のデザイン (5).png	21
\.


--
-- Data for Name: likes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.likes (id, user_id, recipe_id, created_at) FROM stdin;
\.


--
-- Data for Name: nutrition_standards; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.nutrition_standards (age_group, gender, calories, protein, fat, carbohydrates, sugar, salt) FROM stdin;
18-29	male	2500	60	70	300	30	7.5
18-29	female	2000	50	60	250	25	6.5
30-49	male	2400	55	65	280	28	7
30-49	female	1900	45	55	230	23	6
50-64	male	2200	50	60	260	26	6.5
50-64	female	1800	40	50	220	22	5.5
65-74	male	2000	45	55	240	24	6
65-74	female	1700	35	45	200	20	5
75+	male	1800	40	50	220	22	5.5
75+	female	1600	30	40	180	18	4.5
\.


--
-- Data for Name: recipe_genres; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.recipe_genres (id, name) FROM stdin;
1	和食
2	洋食
3	中華
4	イタリアン
5	スイーツ
6	サラダ
7	スープ
8	パスタ
9	ご飯もの
10	おつまみ
11	その他
\.


--
-- Data for Name: recipe_ingredients; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.recipe_ingredients (recipe_id, ingredient_id, quantity_required) FROM stdin;
\.


--
-- Data for Name: recipes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.recipes (id, name, image_url, genre_id, instructions, cooking_time, cost_estimate, summary, nutrition, catchphrase, faq, user_id, is_public, is_draft, created_at, updated_at) FROM stdin;
1450a4ae-5e8c-4c5c-b976-b505500120dd	test	recipes/1450a4ae-5e8c-4c5c-b976-b505500120dd/main/1745551168269707545-名称未設定のデザイン (1).png	10	[{"image_url": "recipes/1450a4ae-5e8c-4c5c-b976-b505500120dd/instructions/1745551168393651504-名称未設定のデザイン (3).png", "stepNumber": 1, "description": "test"}]	5	150	test	{"fat": 0, "salt": 0, "sugar": 0, "protein": 0, "calories": 0, "carbohydrates": 0}	test	[]	\N	t	f	2025-04-25 03:19:28.195957	2025-04-25 03:19:28.424089
\.


--
-- Data for Name: reviews; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.reviews (id, recipe_id, user_id, rating, comment, created_at, updated_at) FROM stdin;
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
16	カップ	カップ1杯（約200ml）	1
12	パック	パック数	1
3	個	個数	1
13	切れ	切れ数	1
10	匹	匹数	1
15	大さじ	大さじ1杯（約15ml）	1
14	小さじ	小さじ1杯（約5ml）	1
21	少々	少々	1
11	尾	尾数	1
6	房	房数	1
4	本	本数	1
5	枚	枚数	1
7	株	株数	1
20	滴	滴数	1
9	缶	缶数	1
8	袋	袋数	1
2	適量	適量	1
19	L	リットル	0.1
17	g	グラム	50
18	kg	キログラム	0.1
1	ml	ミリリットル	50
\.


--
-- Data for Name: user_ingredient_defaults; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_ingredient_defaults (user_id, ingredient_id, default_quantity, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, email, username, profile_image, age, gender) FROM stdin;
\.


--
-- Name: ingredient_genres_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ingredient_genres_id_seq', 11, true);


--
-- Name: ingredients_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ingredients_id_seq', 62, true);


--
-- Name: recipe_genres_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.recipe_genres_id_seq', 11, true);


--
-- Name: units_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.units_id_seq', 1, false);


--
-- Name: ingredient_genres ingredient_genres_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ingredient_genres
    ADD CONSTRAINT ingredient_genres_name_key UNIQUE (name);


--
-- Name: ingredient_genres ingredient_genres_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ingredient_genres
    ADD CONSTRAINT ingredient_genres_pkey PRIMARY KEY (id);


--
-- Name: ingredients ingredients_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ingredients
    ADD CONSTRAINT ingredients_name_key UNIQUE (name);


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
-- Name: nutrition_standards nutrition_standards_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nutrition_standards
    ADD CONSTRAINT nutrition_standards_pkey PRIMARY KEY (age_group, gender);


--
-- Name: recipe_genres recipe_genres_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recipe_genres
    ADD CONSTRAINT recipe_genres_name_key UNIQUE (name);


--
-- Name: recipe_genres recipe_genres_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recipe_genres
    ADD CONSTRAINT recipe_genres_pkey PRIMARY KEY (id);


--
-- Name: recipe_ingredients recipe_ingredients_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recipe_ingredients
    ADD CONSTRAINT recipe_ingredients_pkey PRIMARY KEY (recipe_id, ingredient_id);


--
-- Name: recipes recipes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recipes
    ADD CONSTRAINT recipes_pkey PRIMARY KEY (id);


--
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: units units_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.units
    ADD CONSTRAINT units_pkey PRIMARY KEY (id);


--
-- Name: user_ingredient_defaults user_ingredient_defaults_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_ingredient_defaults
    ADD CONSTRAINT user_ingredient_defaults_pkey PRIMARY KEY (user_id, ingredient_id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: ingredients ingredients_genre_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ingredients
    ADD CONSTRAINT ingredients_genre_id_fkey FOREIGN KEY (genre_id) REFERENCES public.ingredient_genres(id) ON DELETE SET NULL;


--
-- Name: ingredients ingredients_unit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ingredients
    ADD CONSTRAINT ingredients_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES public.units(id);


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
-- Name: reviews reviews_recipe_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_recipe_id_fkey FOREIGN KEY (recipe_id) REFERENCES public.recipes(id) ON DELETE CASCADE;


--
-- Name: user_ingredient_defaults user_ingredient_defaults_ingredient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_ingredient_defaults
    ADD CONSTRAINT user_ingredient_defaults_ingredient_id_fkey FOREIGN KEY (ingredient_id) REFERENCES public.ingredients(id) ON DELETE CASCADE;


--
-- Name: user_ingredient_defaults user_ingredient_defaults_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_ingredient_defaults
    ADD CONSTRAINT user_ingredient_defaults_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

