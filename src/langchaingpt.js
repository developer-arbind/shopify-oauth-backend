import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { Document } from "@langchain/core/documents";
import { createRetrievalChain } from "langchain/chains/retrieval";
import { createHistoryAwareRetriever } from "langchain/chains/history_aware_retriever";
import { MessagesPlaceholder } from "@langchain/core/prompts";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { CheerioWebBaseLoader } from "langchain/document_loaders/web/cheerio";
import { Pinecone } from '@pinecone-database/pinecone';
import { PineconeStore } from "@langchain/pinecone";



const chatModel = new ChatOpenAI({
  streaming: true,
  callbacks: [
    {
      handleLLMNewToken(token){
          process.stdout.write(token);
      }
    }
  ],
  openAIApiKey: "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",
});
const pc = new Pinecone({
  apiKey: '3112c1d3-44c2-4987-9a1e-7db03ba1c632',
});
const pineconeIndex = pc.Index("langchain");
class OpenAiSqlAgent {
  self = this;
  doclength = 0;
  retriever;
  docpageContentlength = 0;
  conversations = [];
  result;
  humanText;
  vectorStore;
  indexName;
  index;
  parentId;
  userId;
  constructor (userId) {
    this.self.userId = userId;
    this.self.initVectorStore();
  }

  async initVectorStore () {
    this.self.vectorStore = await PineconeStore.fromExistingIndex(
      new OpenAIEmbeddings( {
        openAIApiKey: "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"
      } ),
      { pineconeIndex }
    );
  }
  
  async updateEmbeddedDocument (inputOutput, correct, breifEx) {
        try {
        
          await PineconeStore.fromDocuments([new Document({
            metadata: { input$output: `${correct ? "yes" : "no"}`, userId: this.self.userId },
            pageContent: `
            Here's an example of how you performed on this input, and is your output correct as per the user? See it, and if not correct, then try to avoid the mistakes you made in this query. From next time, provide the correct query.\n
            user input: ${inputOutput.humanText} \n
            your result: ${inputOutput.result} \n
            is correct: ${correct ? "yes" : `no, here's why: ${breifEx}`}
             `,
          })], new OpenAIEmbeddings( {
            openAIApiKey: "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"
          }), {
            pineconeIndex,
            maxConcurrency: 5
          });

          const vectorStore =  await PineconeStore.fromExistingIndex(
            new OpenAIEmbeddings({
              openAIApiKey: "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"
            }),
            { pineconeIndex }
          );
        return vectorStore;
      }catch (err) {
        return err;
      }
  }

 

  async makeParentVector (pineconeStore, docs, embeddings) {
    const ids = await pineconeStore.addDocuments(docs);
              
    const vectorStore = await PineconeStore.fromExistingIndex(
      embeddings,
      { pineconeIndex }
    );
  // console.log("ids: ", ids);
  this.self.parentId = ids[0];
  


  return vectorStore;
  }

  async createVectorEmbedding (action, memoryType, docname, mime, path) {
    
    if(action === "local-memory"){

      const loader = new TextLoader(`${path}${path.charAt(path.length - 1) !== "/" ? "/" : ""}${docname}${mime}`);
      let docs = await loader.load();
      docs = await this.self.contextSplitter(docs);
      let vectorStore;
    if(memoryType === "local"){
      vectorStore = await MemoryVectorStore.fromDocuments(
        docs,
        new OpenAIEmbeddings({
          openAIApiKey: "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"
        })
      ); 
    }else {
      //  await this.self.indexVectors(docs);
      // const foo = await this.self.deleteEmbeddedDocument();
      // console.log(foo);
      const embeddings = new OpenAIEmbeddings({
        openAIApiKey: "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"
      })
  const pineconeStore = new PineconeStore(embeddings, { pineconeIndex });
    if(!this.self.parentId){
        vectorStore = await this.self.makeParentVector(pineconeStore, docs, embeddings);
        }else  {
          await pineconeStore.delete({
            ids: [this.self.parentId],
          });
          
          vectorStore = await this.self.makeParentVector(pineconeStore, docs, embeddings);
          
        }
    }
      this.self.vectorStore = vectorStore;
      this.self.doclength = docs.length;
       this.self.docpageContentlength = docs[0].pageContent.length;
      this.self.documentLength++;
      return vectorStore;
    }
    const loader = new CheerioWebBaseLoader(
      path
    );
    

    let docs = await loader.load();

    docs = await this.self.contextSplitter(docs);
    
    this.self.doclength = docs.length;
    this.self.docpageContentlength = docs[0].pageContent.length;
    let vectorStore;
    if(memoryType === "local"){
      vectorStore = await MemoryVectorStore.fromDocuments(
        docs,
        new OpenAIEmbeddings({
          openAIApiKey: "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"
        })
      ); 
    }else {
      // await this.self.indexVectors(docs);
      // const foo = await this.self.deleteEmbeddedDocument();
      // console.log(foo);
      const embeddings = new OpenAIEmbeddings({
        openAIApiKey: "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"
      })
  const pineconeStore = new PineconeStore(embeddings, { pineconeIndex });
    if(!this.self.parentId){
        vectorStore = await this.self.makeParentVector(pineconeStore, docs, embeddings);
        }else  {
          await pineconeStore.delete({
            ids: [this.self.parentId],
          });
          
          vectorStore = await this.self.makeParentVector(pineconeStore, docs, embeddings);
          
        }
    }

    this.self.vectorStore = vectorStore;

    this.self.documentLength++;
    return vectorStore;
  }


  async contextSplitter (docs) {

        
    const splitter = new RecursiveCharacterTextSplitter(); /*
    {
      chunkSize: 200,
      chunkOverlap: 0
    }
    */ 

    const splitDocs = await splitter.splitDocuments(docs);
    this.self.doclength = splitDocs.length;
    this.self.docpageContentlength = splitDocs[0].pageContent.length;

    return splitDocs;
  }
  async addDislike (reason) {
    try {
        
      await PineconeStore.fromDocuments([new Document({
        metadata: { failure$: `yes`, userId: this.self.userId },
        pageContent: `
        user did't like your response and gave a deslike, see why\n
        user input: ${inputOutput.humanText} \n
        your result: ${inputOutput.result} \n
        reason: ${reason}, from the next time please don't repeat this mistake
         `,
      })], new OpenAIEmbeddings( {
        openAIApiKey: "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"
      }), {
        pineconeIndex,
        maxConcurrency: 5
      });

      const vectorStore =  await PineconeStore.fromExistingIndex(
        new OpenAIEmbeddings({
          openAIApiKey: "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"
        }),
        { pineconeIndex }
      );
    return vectorStore;
  }catch (err) {
    return err;
  }
  }
   async creatingVectorIndexedDocument (input, schema, direct) {
      this.self.humanText = input;
        const prompt =
        ChatPromptTemplate.fromTemplate(`If the context is not relevant, 
        please answer the question by using your own knowledge about the topic:

          <context>
          {context}
          </context>

          Question: {input}`);
        // const prompt =
        // ChatPromptTemplate.fromTemplate(`Answer the following question based only on the provided context:

        //   <context>
        //   {context}
        //   </context>

        //   Question: {input}`);

      const documentChain = await createStuffDocumentsChain({
        llm: chatModel,
        prompt,
      });

      // console.log("called asRetrivever: ", this.self.vectorStore.asRetriever());

      const retriever = this.self.vectorStore.asRetriever();
      this.self.retriever = retriever;
    if(direct){
      const directEmbeddingDocResult = await documentChain.invoke({
        input,
        context: [
          new Document({
            pageContent:
            schema,
          }),
        ],
      });
      this.self.result = directEmbeddingDocResult;
      return directEmbeddingDocResult;
    }

    
    const retrievalChain = await createRetrievalChain({
      combineDocsChain: documentChain,
      retriever,
    });


    const result = await retrievalChain.invoke({
      input,
    });
  
    this.self.result = result.answer;
    return result.answer;
  }
  
  
async ConversationalRetrievalChain (input) {
  // console.log("previous text files: ", this.self.humanText, this.self.result);
  this.self.humanText = input;
    const historyAwarePrompt = ChatPromptTemplate.fromMessages([
      new MessagesPlaceholder("chat_history"),
      ["user", "{input}"],
      [
        "user",
        "Given the above conversation, generate a search query to look up in order to get information relevant to the conversation",
      ],
    ]);
    
    const historyAwareRetrieverChain = await createHistoryAwareRetriever({
      llm: chatModel,
      retriever: this.self.retriever,
      rephrasePrompt: historyAwarePrompt,
    });
    
  const historyAwareRetrievalPrompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      "If the context is not relevant, please answer the question by using your own knowledge about the topic:\n\n{context}",
    ],
    new MessagesPlaceholder("chat_history"),
    ["user", "{input}"],
  ]);
  
  const historyAwareCombineDocsChain = await createStuffDocumentsChain({
    llm: chatModel,
    prompt: historyAwareRetrievalPrompt,
  });
  
  const conversationalRetrievalChain = await createRetrievalChain({
    retriever: historyAwareRetrieverChain,
    combineDocsChain: historyAwareCombineDocsChain,
  });

  const result2 = await conversationalRetrievalChain.invoke({
    chat_history: [
      new HumanMessage(this.self.humanText),
      new AIMessage(this.self.result),
    ],
    input,
  });
  
  // console.log(result2.answer);

  this.self.result = result2.answer;

  return result2.answer;
} 

    async intiPinconeIndex (indexName, dimension, serverless) {
    
        try {
          if(serverless){ 
            await pc.createIndex({ /*serverless db*/
              name: indexName,
              dimension,
              metric: 'cosine',
              spec: { 
                  serverless: { 
                      cloud: 'aws', 
                      region: 'us-east' 
                  }
              }
          });
        }else {
          await pc.createIndex ({
            createRequest: {
              name: indexName,
              dimension,
              metric: "cosine"
            }
          })
        }
          this.self.indexName = indexName;
          this.self.index = pc.index(indexName);
        }catch (error) {
          return new Error(error);
        }
    }


async storeOutputasRAG (correct, brief) {

  try {
    this.self.vectorStore = await this.self.updateEmbeddedDocument({
      humanText: this.humanText,
      result: this.result
    }, correct, brief);
    return {
      code: 200,
    };
  }catch (err) {
    return {
      code: 500,
      error: err
    }
  }
}


    async getBriefDef () {  
        try {
          const def = await this.self.creatingVectorIndexedDocument("Can you tell me in brief where I went wrong according to my context when changing an English query to a SQL query according to my database schema?", null, false);
          return  {
            code: 200,
            def
          }
        }catch (err) { 
          return {
            code: 500,
            error: err
          }
        }
    }
  
}


export default OpenAiSqlAgent;

// const SQLAGENT = new OpenAiSqlAgent();
// await SQLAGENT.intiPinconeIndex("langchain", 1536, false);
//  console.log(await SQLAGENT.createVectorEmbedding("local-memory", "hosted","sample", ".txt", "../test/"));

// console.log(await SQLAGENT.creatingVectorIndexedDocument("which os do i like?",null, false));

//  setTimeout (async () => {
//   await SQLAGENT.createVectorEmbedding("local-memory", "hosted","sample", ".txt", "../test/");
//  }, 10000)
// console.log("vector db: ",  await SQLAGENT.createVectorEmbedding("online-storage", "hosted", null, null, "https://dev.to/abdelrahmanallam/8-top-system-design-drawing-tools-for-software-developers-3ol7"));
// console.log("vector db minddataset: ", await SQLAGENT.ConversationalRetrievalChain("and what does he do ?"));

// const index = pc.index('langchain');
// const fetchResult = await index.fetch(['2']);
// console.log("langchain: ", fetchResult);
// console.log(await SQLAGENT.updateEmbeddedDocument());