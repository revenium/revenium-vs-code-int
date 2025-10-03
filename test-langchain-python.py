"""
Test file for LangChain integration detection
"""

# Test Case 1: Basic LangChain import - should be detected
from langchain import LLMChain
import revenium_middleware_openai_python  # Auto-patches underlying OpenAI calls
from langchain.prompts import PromptTemplate

# Test Case 2: LangChain with OpenAI - should be detected
from langchain_openai import ChatOpenAI, OpenAI

# Test Case 3: LangChain with Anthropic
from langchain_anthropic import ChatAnthropic

# Test Case 4: Direct LLM usage without Revenium wrapper
llm = ChatOpenAI(
    model="gpt-4",  # Expensive model
    temperature=0.7,
    api_key="sk-langchain123456789012345678901234567890",  # Hardcoded key
)

# Test Case 5: Chain creation
template = """
You are a helpful assistant. Answer the following question:
{question}
"""

prompt = PromptTemplate(input_variables=["question"], template=template)

chain = LLMChain(llm=llm, prompt=prompt)

# Test Case 6: Chain invocation without tracking
response = chain.invoke({"question": "What is the capital of France?"})

# Test Case 7: Multiple LLM instances
gpt4_llm = ChatOpenAI(model="gpt-4", api_key="sk-gpt4-123456789012345678901234567890")
gpt35_llm = ChatOpenAI(
    model="gpt-3.5-turbo", api_key="sk-gpt35-123456789012345678901234567890"
)
claude_llm = ChatAnthropic(
    model="claude-3-opus", api_key="sk-claude-123456789012345678901234567890"
)

# Test Case 8: Streaming with LangChain
streaming_llm = ChatOpenAI(
    model="gpt-3.5-turbo",
    streaming=True,  # Streaming enabled
    api_key="sk-stream-123456789012345678901234567890",
)

# Test Case 9: LangChain with memory (common pattern)
from langchain.memory import ConversationBufferMemory

memory = ConversationBufferMemory()
conversation_chain = LLMChain(llm=gpt35_llm, prompt=prompt, memory=memory)

# Test Case 10: Agent usage
from langchain.agents import initialize_agent, Tool
from langchain.agents import AgentType

tools = [
    Tool(
        name="Calculator",
        func=lambda x: eval(x),
        description="Useful for math calculations",
    )
]

agent = initialize_agent(
    tools,
    llm=gpt4_llm,  # Using expensive model for agent
    agent=AgentType.ZERO_SHOT_REACT_DESCRIPTION,
)

# Test Case 11: Vector store with embeddings
from langchain.embeddings.openai import OpenAIEmbeddings
from langchain.vectorstores import FAISS

embeddings = OpenAIEmbeddings(api_key="sk-embed-123456789012345678901234567890")

# Test Case 12: Document loader and splitter
from langchain.document_loaders import TextLoader
from langchain.text_splitter import CharacterTextSplitter

print("LangChain test patterns complete")
