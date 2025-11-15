--
-- PostgreSQL database dump
--

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.4 (Debian 17.4-1.pgdg120+2)

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
-- Name: ai_learning_assistant; Type: DATABASE; Schema: -; Owner: postgres
--

CREATE DATABASE ai_learning_assistant WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'en_US.utf8';


ALTER DATABASE ai_learning_assistant OWNER TO postgres;

\connect ai_learning_assistant

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
-- Name: ai_personas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ai_personas (
    persona_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    prompt text NOT NULL,
    is_default_template boolean DEFAULT false NOT NULL
);


ALTER TABLE public.ai_personas OWNER TO postgres;

--
-- Name: chapters; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.chapters (
    chapter_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    course_id uuid NOT NULL,
    title character varying(255) NOT NULL,
    chapter_order integer NOT NULL
);


ALTER TABLE public.chapters OWNER TO postgres;

--
-- Name: courses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.courses (
    course_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    icon_url text NOT NULL,
    description text,
    default_ai_persona_id uuid
);


ALTER TABLE public.courses OWNER TO postgres;

--
-- Name: exercise_options; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.exercise_options (
    option_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    exercise_id uuid NOT NULL,
    option_text text NOT NULL,
    is_correct boolean NOT NULL,
    image text
);


ALTER TABLE public.exercise_options OWNER TO postgres;

--
-- Name: exercises; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.exercises (
    exercise_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    section_id uuid,
    question text NOT NULL,
    type_status character varying(50) NOT NULL,
    score integer DEFAULT 1 NOT NULL,
    answer text,
    image text
);


ALTER TABLE public.exercises OWNER TO postgres;

--
-- Name: COLUMN exercises.type_status; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.exercises.type_status IS '0: 单选, 1: 多选, 2: 简答';


--
-- Name: leading_question; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.leading_question (
    question_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    section_id uuid NOT NULL,
    question text NOT NULL
);


ALTER TABLE public.leading_question OWNER TO postgres;

--
-- Name: sections; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sections (
    section_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    title character varying(255) NOT NULL,
    chapter_id uuid NOT NULL,
    video_url text,
    knowledge_points jsonb,
    video_subtitles jsonb,
    srt_path character varying(512),
    knowledge_content jsonb,
    estimated_time integer,
    section_order integer NOT NULL
);


ALTER TABLE public.sections OWNER TO postgres;

--
-- Name: test_exercises; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.test_exercises (
    test_id uuid NOT NULL,
    exercise_id uuid NOT NULL
);


ALTER TABLE public.test_exercises OWNER TO postgres;

--
-- Name: tests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tests (
    test_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    course_id uuid,
    type_status character varying(50) NOT NULL,
    title character varying(255) NOT NULL
);


ALTER TABLE public.tests OWNER TO postgres;

--
-- Data for Name: ai_personas; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ai_personas (persona_id, name, prompt, is_default_template) FROM stdin;
f8af0aca-e83e-48cd-bafe-13fd277e9769	老师	你是老师	t
\.


--
-- Data for Name: chapters; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.chapters (chapter_id, course_id, title, chapter_order) FROM stdin;
fe3a9ae9-9c21-4c97-ac28-1c3a1a08686c	b94faa90-a168-4eaf-9a90-b336e00f03ce	第一章	1
950ad511-1512-4013-b979-e938a6d1a4f5	b94faa90-a168-4eaf-9a90-b336e00f03ce	第二章	2
\.


--
-- Data for Name: courses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.courses (course_id, name, icon_url, description, default_ai_persona_id) FROM stdin;
b94faa90-a168-4eaf-9a90-b336e00f03ce	课程	http://baidu.com	课程描述	f8af0aca-e83e-48cd-bafe-13fd277e9769
\.


--
-- Data for Name: exercise_options; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.exercise_options (option_id, exercise_id, option_text, is_correct, image) FROM stdin;
2c505395-6e73-4169-8cd2-dccee3df69d2	dc39b49c-5725-4d57-837c-bed984e11dd2	1	t	\N
7b161beb-4957-432b-a6c3-a91273f18c20	dc39b49c-5725-4d57-837c-bed984e11dd2	2	f	\N
\.


--
-- Data for Name: exercises; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.exercises (exercise_id, section_id, question, type_status, score, answer, image) FROM stdin;
dc39b49c-5725-4d57-837c-bed984e11dd2	6ac7772c-0730-4c47-8312-8593a3d6572c	选1	0	10	选1	\N
\.


--
-- Data for Name: leading_question; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.leading_question (question_id, section_id, question) FROM stdin;
\.


--
-- Data for Name: sections; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sections (section_id, title, chapter_id, video_url, knowledge_points, video_subtitles, srt_path, knowledge_content, estimated_time, section_order) FROM stdin;
6ac7772c-0730-4c47-8312-8593a3d6572c	第一节	fe3a9ae9-9c21-4c97-ac28-1c3a1a08686c	http://bilibili.com	{}	{}	123	{}	123	1
9ed0ceb9-473e-422d-be1a-1420b261cfc6	第二节	fe3a9ae9-9c21-4c97-ac28-1c3a1a08686c	http://bilibili.com	{}	{}	123	{}	123	1
38441bef-b945-43a1-b8da-0d4bc959c65d	第三节	fe3a9ae9-9c21-4c97-ac28-1c3a1a08686c	http://bilibili.com	{}	{}	123	{}	123	1
\.


--
-- Data for Name: test_exercises; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.test_exercises (test_id, exercise_id) FROM stdin;
\.


--
-- Data for Name: tests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tests (test_id, course_id, type_status, title) FROM stdin;
\.


--
-- Name: courses PK_42dc69837b2e7bc603686ddaf53; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT "PK_42dc69837b2e7bc603686ddaf53" PRIMARY KEY (course_id);


--
-- Name: exercise_options PK_51c7346e7b620b50b98994ef2b4; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exercise_options
    ADD CONSTRAINT "PK_51c7346e7b620b50b98994ef2b4" PRIMARY KEY (option_id);


--
-- Name: ai_personas PK_7e52b8bb500f0deb90eac642e21; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_personas
    ADD CONSTRAINT "PK_7e52b8bb500f0deb90eac642e21" PRIMARY KEY (persona_id);


--
-- Name: exercises PK_8c00240bb09590e30ab8b041aec; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exercises
    ADD CONSTRAINT "PK_8c00240bb09590e30ab8b041aec" PRIMARY KEY (exercise_id);


--
-- Name: leading_question PK_9a26424fabc1f4ceee91a8e5540; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leading_question
    ADD CONSTRAINT "PK_9a26424fabc1f4ceee91a8e5540" PRIMARY KEY (question_id);


--
-- Name: sections PK_c5641bfa4992d9bb24205e4cf12; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sections
    ADD CONSTRAINT "PK_c5641bfa4992d9bb24205e4cf12" PRIMARY KEY (section_id);


--
-- Name: test_exercises PK_ca334cc3a335f8065231a1dd4b7; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_exercises
    ADD CONSTRAINT "PK_ca334cc3a335f8065231a1dd4b7" PRIMARY KEY (test_id, exercise_id);


--
-- Name: chapters PK_e4b8449ce68d3f471e71036eb8b; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chapters
    ADD CONSTRAINT "PK_e4b8449ce68d3f471e71036eb8b" PRIMARY KEY (chapter_id);


--
-- Name: tests PK_f8c701fbb2c6f4fb85cebfa0000; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tests
    ADD CONSTRAINT "PK_f8c701fbb2c6f4fb85cebfa0000" PRIMARY KEY (test_id);


--
-- Name: leading_question FK_07332cfb9e4e2bc4a8e8ce56960; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leading_question
    ADD CONSTRAINT "FK_07332cfb9e4e2bc4a8e8ce56960" FOREIGN KEY (section_id) REFERENCES public.sections(section_id);


--
-- Name: tests FK_52bc024ee22a89e4c40f1668790; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tests
    ADD CONSTRAINT "FK_52bc024ee22a89e4c40f1668790" FOREIGN KEY (course_id) REFERENCES public.courses(course_id);


--
-- Name: sections FK_54d3bf4ecda2c5ac30428116767; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sections
    ADD CONSTRAINT "FK_54d3bf4ecda2c5ac30428116767" FOREIGN KEY (chapter_id) REFERENCES public.chapters(chapter_id);


--
-- Name: exercise_options FK_619f19aa742d2a259eb131144be; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exercise_options
    ADD CONSTRAINT "FK_619f19aa742d2a259eb131144be" FOREIGN KEY (exercise_id) REFERENCES public.exercises(exercise_id);


--
-- Name: courses FK_7e6c4f3c5fe06138a2de115eaaf; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT "FK_7e6c4f3c5fe06138a2de115eaaf" FOREIGN KEY (default_ai_persona_id) REFERENCES public.ai_personas(persona_id);


--
-- Name: chapters FK_9909a69a63f1d064b42ef35ab04; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chapters
    ADD CONSTRAINT "FK_9909a69a63f1d064b42ef35ab04" FOREIGN KEY (course_id) REFERENCES public.courses(course_id);


--
-- Name: exercises FK_a7c55ec2600ffaf8301dde37ac1; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exercises
    ADD CONSTRAINT "FK_a7c55ec2600ffaf8301dde37ac1" FOREIGN KEY (section_id) REFERENCES public.sections(section_id);


--
-- PostgreSQL database dump complete
--

