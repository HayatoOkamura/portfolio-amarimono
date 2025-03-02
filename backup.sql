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
    description character varying(100)
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
    email text NOT NULL
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
1	Vegetable
2	Fruit
3	Meat
4	Dairy
5	Grain
6	Spices
\.


--
-- Data for Name: ingredients; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ingredients (id, name, image_url, quantity, unit_id, genre_id) FROM stdin;
1	Tomato	https://example.com/tomato.jpg	10	3	1
2	Pasta	https://example.com/pasta.jpg	20	1	5
3	Egg	https://example.com/egg.jpg	12	3	4
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
1	Italian
2	French
3	Asian
4	Mexican
5	Vegetarian
\.


--
-- Data for Name: recipe_ingredients; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.recipe_ingredients (ingredient_id, quantity_required, recipe_id) FROM stdin;
2	100	\N
3	2	\N
1	3	\N
1	1	5cd6c366-d1e1-4ce5-9d3d-37faa96e7acb
2	50	5cd6c366-d1e1-4ce5-9d3d-37faa96e7acb
2	100	5d6e5e7a-a9ff-4a60-a746-663571211e0f
3	1	5d6e5e7a-a9ff-4a60-a746-663571211e0f
2	150	301f9d4c-0006-474d-9d98-0b050bff4f89
1	2	04ba6dc3-8594-4f2a-8ce4-9676ffba2584
3	1	04ba6dc3-8594-4f2a-8ce4-9676ffba2584
2	100	6180b878-90c7-4be3-848f-a854616abd58
3	1	6180b878-90c7-4be3-848f-a854616abd58
2	100	6f7ae6da-c254-472a-89a0-0fc2430f8074
3	1	6f7ae6da-c254-472a-89a0-0fc2430f8074
2	50	ba7e3bfc-b467-4a1e-a69f-76b3516d0f99
3	1	ba7e3bfc-b467-4a1e-a69f-76b3516d0f99
2	50	0feb4047-e875-4e96-95e2-e58d4476dc17
\.


--
-- Data for Name: recipes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.recipes (name, image_url, genre_id, instructions, cooking_time, reviews, cost_estimate, summary, nutrition, faq, catchphrase, id, user_id, is_public) FROM stdin;
user11	user11/1740522765336232550-名称未設定のデザイン (4).png	4	[{"image_url": "user11/instructions/1740522765261586592-名称未設定のデザイン (4).png", "stepNumber": 1, "description": "user11"}]	1	1.0	user11	user11	{"fat": 0, "salt": 0, "sugar": 0, "protein": 0, "calories": -1, "carbohydrates": 0}	[{"answer": "user11", "question": "user11"}]	user11	0feb4047-e875-4e96-95e2-e58d4476dc17	5e4a4e1e-7fb7-4283-8c0c-4f882ad149e2	t
test01	test01/1740505817194192002-名称未設定のデザイン (4).png	4	[{"image_url": "test01/instructions/1740505817106465877-名称未設定のデザイン (3).png", "stepNumber": 1, "description": "test01"}]	1	1.0	test01	test01	{"fat": 0, "salt": 0, "sugar": 0, "protein": 0, "calories": 2, "carbohydrates": 0}	[{"answer": "test01", "question": "test01"}]	test01	5cd6c366-d1e1-4ce5-9d3d-37faa96e7acb	\N	t
user01	user01/1740505869662427429-名称未設定のデザイン (4).png	1	[{"image_url": "user01/instructions/1740505869600334137-名称未設定のデザイン (4).png", "stepNumber": 1, "description": "user01"}]	1	1.0	user01	user01	{"fat": 0, "salt": 0, "sugar": 0, "protein": 0, "calories": 1, "carbohydrates": 0}	[{"answer": "user01", "question": "user01user01"}]	user01	5d6e5e7a-a9ff-4a60-a746-663571211e0f	\N	t
user02	user02/1740517069045048596-名称未設定のデザイン (2).png	3	[{"image_url": "user02/instructions/1740517068864467763-名称未設定のデザイン (1).png", "stepNumber": 1, "description": "user02"}]	1	1.0	user02	user02	{"fat": 0, "salt": 0, "sugar": 0, "protein": 0, "calories": 3, "carbohydrates": 0}	[{"answer": "user02", "question": "user02"}]	user02	301f9d4c-0006-474d-9d98-0b050bff4f89	\N	t
user03	user03/1740517183902631719-名称未設定のデザイン (1).jpg	5	[{"image_url": "user03/instructions/1740517183816486885-名称未設定のデザイン (3).png", "stepNumber": 1, "description": "user03"}]	1	1.0	user03	user03	{"fat": 0, "salt": 0, "sugar": -2, "protein": 0, "calories": 0, "carbohydrates": 0}	[{"answer": "user03", "question": "user03"}]	user03	04ba6dc3-8594-4f2a-8ce4-9676ffba2584	\N	t
test03	test03/1740517665367404927-名称未設定のデザイン (4).png	2	[{"image_url": "test03/instructions/1740517665237938594-名称未設定のデザイン (2).png", "stepNumber": 1, "description": "test03"}]	1	1.0	test03	test03	{"fat": 0, "salt": 0, "sugar": 0, "protein": 0, "calories": -2, "carbohydrates": 0}	[{"answer": "test03", "question": "test03"}]	test03	6180b878-90c7-4be3-848f-a854616abd58	\N	t
user04	user04/1740517714828411714-名称未設定のデザイン (5).png	2	[{"image_url": "user04/instructions/1740517714757917089-名称未設定のデザイン (3).png", "stepNumber": 1, "description": "user04"}]	1	1.0	user04user04	user04	{"fat": 0, "salt": 0, "sugar": 0, "protein": 0, "calories": 2, "carbohydrates": 0}	[{"answer": "user04", "question": "user04"}]	user04	6f7ae6da-c254-472a-89a0-0fc2430f8074	\N	t
user10	user10/1740522335357462712-名称未設定のデザイン (3).png	3	[{"image_url": "user10/instructions/1740522335238788087-名称未設定のデザイン (2).png", "stepNumber": 1, "description": "user10"}]	1	1.0	user10	user10	{"fat": 0, "salt": 0, "sugar": 0, "protein": 0, "calories": -1, "carbohydrates": 0}	[{"answer": "user10", "question": "user10"}]	user10	ba7e3bfc-b467-4a1e-a69f-76b3516d0f99	5e4a4e1e-7fb7-4283-8c0c-4f882ad149e2	t
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

COPY public.units (id, name, description) FROM stdin;
1	g	グラム
2	ml	ミリリットル
3	個	個数
4	tbsp	大さじ
5	tsp	小さじ
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, email) FROM stdin;
5e4a4e1e-7fb7-4283-8c0c-4f882ad149e2	keepsmile.lucky7@gmail.com
\.


--
-- Name: ingredient_genres_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ingredient_genres_id_seq', 6, true);


--
-- Name: ingredients_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ingredients_id_seq', 3, true);


--
-- Name: nutritionstandard_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.nutritionstandard_id_seq', 1, true);


--
-- Name: recipe_genres_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.recipe_genres_id_seq', 5, true);


--
-- Name: units_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.units_id_seq', 5, true);


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

