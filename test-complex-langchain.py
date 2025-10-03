#!/usr/bin/env python3
"""
Complex LangChain usage patterns test file
Tests LangChain scenarios that should trigger Revenium integration
"""

import os
from typing import List, Dict, Any
import asyncio

# LangChain imports - multiple patterns to detect
import revenium_middleware_openai_python  # Auto-patches underlying OpenAI calls
from langchain.llms import OpenAI
from langchain.chat_models import ChatOpenAI
from langchain.embeddings import OpenAIEmbeddings
from langchain.schema import HumanMessage, SystemMessage, AIMessage
from langchain.prompts import PromptTemplate, ChatPromptTemplate
from langchain.chains import LLMChain, SimpleSequentialChain, ConversationChain
from langchain.agents import initialize_agent, Tool, AgentType
from langchain.memory import ConversationBufferMemory
from langchain.vectorstores import FAISS, Chroma
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.document_loaders import TextLoader
from langchain.retrievers import VectorStoreRetriever

# Anthropic LangChain integration
from langchain.chat_models import ChatAnthropic
from langchain.llms import Anthropic


# Test 1: Basic LangChain LLM usage
def basic_langchain_openai():
    """Basic LangChain OpenAI usage"""

    # Direct OpenAI LLM
    llm = OpenAI(
        openai_api_key="sk-test-langchain-key-123",  # Security issue
        temperature=0.9,
        max_tokens=2000,  # High token usage
    )

    response = llm("Write a comprehensive guide about machine learning")
    return response


# Test 2: Chat models with expensive operations
def chat_model_usage():
    """LangChain Chat model usage"""

    chat_model = ChatOpenAI(
        openai_api_key="sk-chat-key-456",  # Security issue
        model_name="gpt-4",  # Expensive model
        temperature=0.7,
        max_tokens=3000,  # High token usage
    )

    messages = [
        SystemMessage(content="You are a helpful AI assistant"),
        HumanMessage(content="Explain quantum computing in detail"),
    ]

    response = chat_model(messages)
    return response


# Test 3: LangChain Chains (multiple LLM calls)
def chain_operations():
    """LangChain chain operations - multiple LLM calls"""

    llm = ChatOpenAI(
        model_name="gpt-4",  # Expensive
        temperature=0.5,
        openai_api_key=os.getenv(
            "OPENAI_API_KEY", "sk-fallback-key-789"
        ),  # Security issue
    )

    # Prompt templates
    prompt1 = PromptTemplate(
        input_variables=["topic"], template="Write an outline about {topic}"
    )

    prompt2 = PromptTemplate(
        input_variables=["outline"],
        template="Expand this outline into a full article: {outline}",
    )

    # Sequential chain - multiple expensive calls
    chain1 = LLMChain(llm=llm, prompt=prompt1)
    chain2 = LLMChain(llm=llm, prompt=prompt2)

    sequential_chain = SimpleSequentialChain(chains=[chain1, chain2], verbose=True)

    # This triggers multiple GPT-4 calls
    result = sequential_chain.run("artificial intelligence")
    return result


# Test 4: Embedding operations
def embedding_operations():
    """LangChain embedding operations"""

    embeddings = OpenAIEmbeddings(
        openai_api_key="sk-embed-key-123",  # Security issue
        model="text-embedding-ada-002",
    )

    # Large batch of texts - could be expensive
    texts = [f"Document {i} content here" for i in range(1000)]

    # Inefficient: Individual embedding calls
    embedded_docs = []
    for text in texts:
        embedding = embeddings.embed_query(text)
        embedded_docs.append(embedding)

    return embedded_docs


# Test 5: Vector store operations
def vector_store_operations():
    """Vector store with embeddings"""

    embeddings = OpenAIEmbeddings(
        openai_api_key="sk-vector-key-456",  # Security issue
    )

    # Create large vector store
    texts = [f"Knowledge base document {i}" for i in range(500)]

    # This triggers many embedding calls
    vectorstore = FAISS.from_texts(texts=texts, embedding=embeddings)

    # Retrieval that could be expensive
    retriever = vectorstore.as_retriever(search_kwargs={"k": 10})
    docs = retriever.get_relevant_documents("machine learning")

    return docs


# Test 6: RAG (Retrieval Augmented Generation)
def rag_pipeline():
    """RAG pipeline with LangChain"""

    # Setup components
    embeddings = OpenAIEmbeddings(openai_api_key="sk-rag-key-789")  # Security issue
    llm = ChatOpenAI(
        model_name="gpt-4",  # Expensive
        openai_api_key="sk-rag-llm-key-012",  # Security issue
    )

    # Load and split documents
    loader = TextLoader("example_document.txt")
    documents = loader.load()

    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    splits = text_splitter.split_documents(documents)

    # Create vector store - many embedding calls
    vectorstore = Chroma.from_documents(documents=splits, embedding=embeddings)

    # RAG chain
    retriever = vectorstore.as_retriever()

    # This combines retrieval + generation = expensive
    def rag_chain(question):
        docs = retriever.get_relevant_documents(question)
        context = "\\n".join([doc.page_content for doc in docs])

        messages = [
            SystemMessage(content="Answer based on the provided context"),
            HumanMessage(content=f"Context: {context}\\n\\nQuestion: {question}"),
        ]

        response = llm(messages)
        return response

    return rag_chain


# Test 7: Agent operations (multiple tool calls)
def agent_operations():
    """LangChain agent with tools"""

    llm = ChatOpenAI(
        model_name="gpt-4",  # Expensive for agents
        temperature=0,
        openai_api_key="sk-agent-key-345",  # Security issue
    )

    # Define tools
    def search_tool(query: str) -> str:
        return f"Search results for: {query}"

    def calculator_tool(expression: str) -> str:
        try:
            return str(eval(expression))
        except:
            return "Invalid expression"

    tools = [
        Tool(name="Search", func=search_tool, description="Search for information"),
        Tool(
            name="Calculator", func=calculator_tool, description="Perform calculations"
        ),
    ]

    # Initialize agent - can make many LLM calls
    agent = initialize_agent(
        tools=tools, llm=llm, agent=AgentType.ZERO_SHOT_REACT_DESCRIPTION, verbose=True
    )

    # Complex query that triggers multiple tool calls
    result = agent.run(
        "Search for information about quantum computing, "
        "then calculate how much 15% of $50,000 would be for a quantum computer budget"
    )

    return result


# Test 8: Conversation with memory
def conversation_with_memory():
    """Conversation chain with memory"""

    llm = ChatOpenAI(
        model_name="gpt-4",  # Expensive
        openai_api_key="sk-memory-key-678",  # Security issue
    )

    memory = ConversationBufferMemory()

    conversation = ConversationChain(llm=llm, memory=memory, verbose=True)

    # Multiple turns - accumulating cost
    responses = []
    questions = [
        "Tell me about machine learning",
        "How does it relate to deep learning?",
        "What are some practical applications?",
        "Can you give me code examples?",
        "How do I get started with this field?",
    ]

    for question in questions:
        response = conversation.predict(input=question)
        responses.append(response)

    return responses


# Test 9: Anthropic with LangChain
def anthropic_langchain():
    """LangChain with Anthropic models"""

    # Chat Anthropic
    chat_anthropic = ChatAnthropic(
        anthropic_api_key="sk-ant-langchain-key-123",  # Security issue
        model="claude-3-opus-20240229",  # Expensive model
        max_tokens=2000,
    )

    # LLM Anthropic
    llm_anthropic = Anthropic(
        anthropic_api_key="sk-ant-llm-key-456",  # Security issue
        max_tokens_to_sample=1500,
    )

    # Use in chain
    prompt = PromptTemplate(
        input_variables=["topic"], template="Write a detailed analysis of {topic}"
    )

    chain = LLMChain(llm=chat_anthropic, prompt=prompt)
    result = chain.run("climate change impacts")

    return result


# Test 10: Batch processing inefficiencies
class LangChainService:
    """Service using LangChain - potential inefficiencies"""

    def __init__(self):
        self.llm = ChatOpenAI(
            model_name="gpt-4-turbo",  # Expensive
            openai_api_key="sk-service-key-789",  # Security issue
            temperature=0.3,
        )

        self.embeddings = OpenAIEmbeddings(
            openai_api_key="sk-embed-service-key-012"  # Security issue
        )

    def process_documents(self, documents: List[str]) -> List[str]:
        """Process multiple documents - not optimized"""

        results = []
        for doc in documents:  # Should batch these
            prompt = f"Summarize this document: {doc}"
            messages = [HumanMessage(content=prompt)]
            response = self.llm(messages)
            results.append(response.content)

        return results

    def create_embeddings_batch(self, texts: List[str]) -> List[List[float]]:
        """Create embeddings - not optimized"""

        embeddings = []
        for text in texts:  # Should use batch embedding
            embedding = self.embeddings.embed_query(text)
            embeddings.append(embedding)

        return embeddings


if __name__ == "__main__":
    print("Testing LangChain operations...")

    # Test basic operations
    basic_langchain_openai()
    chat_model_usage()

    print("Testing chain operations...")
    chain_operations()

    print("Testing embeddings...")
    embedding_operations()

    print("Testing service class...")
    service = LangChainService()
    docs = ["Document 1", "Document 2", "Document 3"]
    service.process_documents(docs)

    print("LangChain tests complete!")
