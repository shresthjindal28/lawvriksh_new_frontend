import { DocumentType, Template } from '@/types/project';

// 1. Assignment Template (Legal Case Analysis)
const ASSIGNMENT_TEMPLATE: Template = {
  templateId: 'tmpl_assignment_001',
  title: 'Assignment',
  category: 'assignment',
  tags: ['assignment', 'legal', 'case'],
  content: {
    time: Date.now(),
    blocks: [
      {
        id: 'header_info',
        type: 'paragraph',
        data: {
          text: '',
          placeholder:
            '<b>Student Name:</b> Your Name<br><b>Course:</b> Course Name and Code<br><b>Professor:</b> Professor Name<br><b>Date:</b> Submission Date',
        },
      },
      {
        id: 'title_block',
        type: 'header',
        data: {
          text: 'Case Analysis Title',
          level: 1,
        },
      },
      {
        id: 'introduction_header',
        type: 'header',
        data: {
          text: '1. Introduction',
          level: 2,
        },
      },
      {
        id: 'introduction_para1',
        type: 'paragraph',
        data: {
          text: '',
          placeholder:
            'What is the background of this legal issue? Provide context about the area of law and the circumstances that led to this case or legal question. [~200-300 words]',
        },
      },
      {
        id: 'introduction_para2',
        type: 'paragraph',
        data: {
          text: '',
          placeholder:
            'Why is this topic significant? Explain the importance of this legal issue in contemporary law and its impact on society, legal practice, or jurisprudence.',
        },
      },
      {
        id: 'introduction_para3',
        type: 'paragraph',
        data: {
          text: '',
          placeholder:
            'What will this assignment cover? Provide a roadmap of the analysis you will undertake, outlining the structure and scope of your examination.',
        },
      },
      {
        id: 'facts_header',
        type: 'header',
        data: {
          text: '1.1 Facts',
          level: 3,
        },
      },
      {
        id: 'facts_para1',
        type: 'paragraph',
        data: {
          text: '',
          placeholder:
            'Who are the parties involved? Identify the petitioner/plaintiff, respondent/defendant, and any other relevant parties to the case. [~300-400 words]',
        },
      },
      {
        id: 'facts_para2',
        type: 'paragraph',
        data: {
          text: '',
          placeholder:
            'What happened chronologically? Present the sequence of events that led to the legal dispute, including the factual background and circumstances.',
        },
      },
      {
        id: 'facts_para3',
        type: 'paragraph',
        data: {
          text: '',
          placeholder:
            'What are the key dates and events? Highlight the crucial timeline elements, including filing dates, hearings, and any significant procedural milestones.',
        },
      },
      {
        id: 'issues_header',
        type: 'header',
        data: {
          text: '1.2 Issues',
          level: 3,
        },
      },
      {
        id: 'issues_para1',
        type: 'paragraph',
        data: {
          text: '',
          placeholder:
            'What is the primary legal question? Clearly state the main issue that the court must decide or that your analysis addresses. [~150-200 words]',
        },
      },
      {
        id: 'issues_para2',
        type: 'paragraph',
        data: {
          text: '',
          placeholder:
            'Are there any secondary issues? Identify any subsidiary questions or related legal points that emerge from the case.',
        },
      },
      {
        id: 'issues_para3',
        type: 'paragraph',
        data: {
          text: '',
          placeholder:
            'Which area of law does this fall under? Specify the relevant branch of law (constitutional, criminal, civil, etc.) and applicable statutory provisions.',
        },
      },
      {
        id: 'arguments_header',
        type: 'header',
        data: {
          text: '1.3 Arguments',
          level: 3,
        },
      },
      {
        id: 'arguments_para1',
        type: 'paragraph',
        data: {
          text: '',
          placeholder:
            "What is the petitioner's main argument? Present the core legal contentions, statutory interpretations, and reasoning advanced by the petitioner/plaintiff. [~800-1000 words]",
        },
      },
      {
        id: 'arguments_para2',
        type: 'paragraph',
        data: {
          text: '',
          placeholder:
            "What is the respondent's counter-argument? Detail the opposing party's legal position, defenses raised, and alternative interpretations of law or facts.",
        },
      },
      {
        id: 'arguments_para3',
        type: 'paragraph',
        data: {
          text: '',
          placeholder:
            'Which case laws support each side? Analyze the precedents cited by both parties, explaining how each side relies on previous judicial decisions to support their position. Include case names, citations, and the relevant legal principles established.',
        },
      },
      {
        id: 'judgements_header',
        type: 'header',
        data: {
          text: '1.4 Judgements',
          level: 3,
        },
      },
      {
        id: 'judgements_para1',
        type: 'paragraph',
        data: {
          text: '',
          placeholder:
            "What did the court finally decide in this matter? Provide a clear summary of the court's decision, including whether the petition was allowed, dismissed, or partially accepted. [~500-800 words]",
        },
      },
      {
        id: 'judgements_para2',
        type: 'paragraph',
        data: {
          text: '',
          placeholder:
            "What is the core legal principle (ratio decidendi) established by this judgment? Identify and explain the binding legal principle that forms the basis of the court's decision and will serve as precedent.",
        },
      },
      {
        id: 'judgements_para3',
        type: 'paragraph',
        data: {
          text: '',
          placeholder:
            "Were there any additional observations or comments by the court (obiter dicta)? Discuss any supplementary remarks, suggestions for legislative reform, or broader observations made by the court that don't form part of the binding precedent.",
        },
      },
      {
        id: 'conclusion_header',
        type: 'header',
        data: {
          text: '2. Conclusion',
          level: 2,
        },
      },
      {
        id: 'conclusion_para1',
        type: 'paragraph',
        data: {
          text: '',
          placeholder:
            'Summarize the key findings from your analysis. What are the main takeaways from this case or legal issue? [~200-300 words]',
        },
      },
      {
        id: 'conclusion_para2',
        type: 'paragraph',
        data: {
          text: '',
          placeholder:
            'Evaluate the significance of this judgment or legal development. What impact does it have on existing law, future cases, or legal practice? What are the broader implications for jurisprudence?',
        },
      },
      {
        id: 'references_header',
        type: 'header',
        data: {
          text: 'References',
          level: 2,
        },
      },
      {
        id: 'references_list',
        type: 'list',
        data: {
          style: 'ordered',
          items: [
            'Case Name, Citation, Court (Year)',
            'Statute Name, Section, Year',
            "Author Name, 'Article Title' (Year) Volume Journal Name Page",
            'Author Name, Book Title (Publisher, Year)',
          ],
        },
      },
    ],
    version: '2.28.0',
  },
};

// 2. Research Paper Template (Legal Research)
const RESEARCH_PAPER_TEMPLATE: Template = {
  templateId: 'tmpl_research_001',
  title: 'Research Paper',
  category: 'research_paper',
  tags: ['research', 'legal', 'paper'],
  content: {
    time: Date.now(),
    blocks: [
      {
        id: 'title_block',
        type: 'header',
        data: {
          text: 'Research Paper Title',
          level: 1,
        },
      },
      {
        id: 'authors_block',
        type: 'paragraph',
        data: {
          text: '',
          placeholder: '<b>Author Name</b><br><i>Institution Name</i><br>email@example.com',
        },
      },
      {
        id: 'abstract_header',
        type: 'header',
        data: {
          text: '1. Abstract',
          level: 2,
        },
      },
      {
        id: 'abstract_para1',
        type: 'paragraph',
        data: {
          text: '',
          placeholder:
            "What is the paper's focus or legal issue? Clearly state the specific legal question or topic this research addresses. [~150-200 words]",
        },
      },
      {
        id: 'abstract_para2',
        type: 'paragraph',
        data: {
          text: '',
          placeholder:
            'Why is it relevant now? Explain the contemporary significance and timeliness of this research.',
        },
      },
      {
        id: 'abstract_para3',
        type: 'paragraph',
        data: {
          text: '',
          placeholder:
            'What argument or perspective are you presenting? State your thesis or central claim.',
        },
      },
      {
        id: 'abstract_para4',
        type: 'paragraph',
        data: {
          text: '',
          placeholder:
            'What are your major findings or conclusions? Briefly summarize the key outcomes of your research.',
        },
      },
      {
        id: 'keywords_para',
        type: 'paragraph',
        data: {
          text: '',
          placeholder: '<b>Keywords:</b> keyword 1, keyword 2, keyword 3, keyword 4, keyword 5',
        },
      },
      {
        id: 'introduction_header',
        type: 'header',
        data: {
          text: '2. Introduction',
          level: 2,
        },
      },
      {
        id: 'introduction_para1',
        type: 'paragraph',
        data: {
          text: '',
          placeholder:
            'What is the background and context of this legal topic? Provide the historical, social, or legal context necessary to understand your research question. [~200-300 words]',
        },
      },
      {
        id: 'introduction_para2',
        type: 'paragraph',
        data: {
          text: '',
          placeholder:
            'Why is this research question or topic significant in current law? Establish the importance and relevance of your research in contemporary legal discourse.',
        },
      },
      {
        id: 'introduction_para3',
        type: 'paragraph',
        data: {
          text: '',
          placeholder:
            'What is your thesis statement or research objective? Clearly articulate the central argument or purpose of your research.',
        },
      },
      {
        id: 'introduction_para4',
        type: 'paragraph',
        data: {
          text: '',
          placeholder:
            'What will this research paper examine? Outline the scope and structure of your paper, explaining what each section will address.',
        },
      },
      {
        id: 'literature_header',
        type: 'header',
        data: {
          text: '3. Literature Review',
          level: 2,
        },
      },
      {
        id: 'literature_para1',
        type: 'paragraph',
        data: {
          text: '',
          placeholder:
            'What existing scholarly work addresses this topic? Survey the relevant academic literature, judicial decisions, and legal commentary related to your research question. [~800-1200 words]',
        },
      },
      {
        id: 'literature_para2',
        type: 'paragraph',
        data: {
          text: '',
          placeholder:
            'What are the key debates or perspectives in the field? Identify and discuss the major schools of thought, controversies, or conflicting interpretations in existing scholarship.',
        },
      },
      {
        id: 'literature_para3',
        type: 'paragraph',
        data: {
          text: '',
          placeholder:
            'How does your research relate to existing literature? Position your work within the broader academic conversation, showing how it builds upon, challenges, or extends previous research.',
        },
      },
      {
        id: 'literature_para4',
        type: 'paragraph',
        data: {
          text: '',
          placeholder:
            'What gaps or limitations exist in current scholarship? Identify the deficiencies, unanswered questions, or areas requiring further investigation that your research addresses.',
        },
      },
      {
        id: 'methodology_header',
        type: 'header',
        data: {
          text: '4. Research Methodology',
          level: 2,
        },
      },
      {
        id: 'methodology_para1',
        type: 'paragraph',
        data: {
          text: '',
          placeholder:
            "What research method are you using (doctrinal, comparative, empirical)? Specify whether you're conducting doctrinal analysis, comparative legal research, empirical studies, or a combination. [~400-600 words]",
        },
      },
      {
        id: 'methodology_para2',
        type: 'paragraph',
        data: {
          text: '',
          placeholder:
            'Why is this methodology suited to your research question? Justify your chosen approach and explain how it enables you to address your research objectives effectively.',
        },
      },
      {
        id: 'methodology_para3',
        type: 'paragraph',
        data: {
          text: '',
          placeholder:
            'What sources and data are you analyzing? Detail the primary and secondary sources, including statutes, case law, international instruments, academic literature, and any empirical data.',
        },
      },
      {
        id: 'methodology_para4',
        type: 'paragraph',
        data: {
          text: '',
          placeholder:
            'How are you collecting and analyzing information? Describe your research process, analytical framework, and the criteria used for evaluating and synthesizing legal materials.',
        },
      },
      {
        id: 'analysis_header',
        type: 'header',
        data: {
          text: '5. Analysis / Discussion',
          level: 2,
        },
      },
      {
        id: 'analysis_para1',
        type: 'paragraph',
        data: {
          text: '',
          placeholder:
            'What are the key findings from your research? Present your main discoveries and insights organized thematically or chronologically. [~1500-2500 words]',
        },
      },
      {
        id: 'analysis_para2',
        type: 'paragraph',
        data: {
          text: '',
          placeholder:
            'How do statutes, cases, and legal principles address your research question? Analyze relevant legislative provisions, judicial precedents, and doctrinal principles, examining their interpretation and application.',
        },
      },
      {
        id: 'analysis_para3',
        type: 'paragraph',
        data: {
          text: '',
          placeholder:
            'What problems or gaps exist in current law? Critically evaluate the existing legal framework, identifying inconsistencies, ambiguities, or areas where the law is underdeveloped or inadequate.',
        },
      },
      {
        id: 'analysis_para4',
        type: 'paragraph',
        data: {
          text: '',
          placeholder:
            'What are counterarguments or alternative perspectives? Consider opposing viewpoints and alternative interpretations, demonstrating balanced and nuanced legal analysis.',
        },
      },
      {
        id: 'analysis_para5',
        type: 'paragraph',
        data: {
          text: '',
          placeholder:
            'What are the practical implications of your analysis? Discuss the real-world consequences and applications of your findings for legal practitioners, policymakers, or affected parties.',
        },
      },
      {
        id: 'findings_header',
        type: 'header',
        data: {
          text: '6. Discussion of Findings',
          level: 2,
        },
      },
      {
        id: 'findings_para1',
        type: 'paragraph',
        data: {
          text: '',
          placeholder:
            'What do your findings reveal about the law in this area? Synthesize your research results and explain what they tell us about the current state of the law. [~400-800 words]',
        },
      },
      {
        id: 'findings_para2',
        type: 'paragraph',
        data: {
          text: '',
          placeholder:
            'What are the broader implications of your analysis? Consider the wider significance of your findings for legal theory, jurisprudence, or policy development.',
        },
      },
      {
        id: 'findings_para3',
        type: 'paragraph',
        data: {
          text: '',
          placeholder:
            'How do your findings relate to existing scholarship? Connect your results back to the literature review, showing how your research confirms, contradicts, or extends previous work.',
        },
      },
      {
        id: 'findings_para4',
        type: 'paragraph',
        data: {
          text: '',
          placeholder:
            'What challenges or controversies remain unresolved? Acknowledge the limitations of your research and identify ongoing debates or questions that require further study.',
        },
      },
      {
        id: 'findings_para5',
        type: 'paragraph',
        data: {
          text: '',
          placeholder:
            'What policy or reform suggestions emerge from your research? Propose concrete recommendations for legislative amendment, judicial reconsideration, or policy changes based on your findings.',
        },
      },
      {
        id: 'conclusion_header',
        type: 'header',
        data: {
          text: '7. Conclusion',
          level: 2,
        },
      },
      {
        id: 'conclusion_para1',
        type: 'paragraph',
        data: {
          text: '',
          placeholder:
            'What is your final position or finding on the research question? Restate your thesis and summarize your conclusion in light of the evidence and analysis presented. [~400-600 words]',
        },
      },
      {
        id: 'conclusion_para2',
        type: 'paragraph',
        data: {
          text: '',
          placeholder:
            'How do your conclusions address the research objectives stated in the introduction? Demonstrate how your research has fulfilled its stated aims and answered the questions posed.',
        },
      },
      {
        id: 'conclusion_para3',
        type: 'paragraph',
        data: {
          text: '',
          placeholder:
            'What are the key takeaways from this research? Highlight the most important insights and contributions of your work to legal scholarship.',
        },
      },
      {
        id: 'conclusion_para4',
        type: 'paragraph',
        data: {
          text: '',
          placeholder:
            'What areas warrant further investigation? Suggest directions for future research and identify questions that remain unanswered.',
        },
      },
      {
        id: 'conclusion_para5',
        type: 'paragraph',
        data: {
          text: '',
          placeholder:
            'What recommendations do you offer? Provide final thoughts on potential reforms, policy changes, or practical applications emerging from your research.',
        },
      },
      {
        id: 'references_header',
        type: 'header',
        data: {
          text: 'References',
          level: 2,
        },
      },
      {
        id: 'references_list',
        type: 'list',
        data: {
          style: 'ordered',
          items: [
            'Case Name v Case Name [Year] Citation (Court)',
            'Legislation Name Year, Section/Article',
            "Author(s), 'Article Title' (Year) Volume Journal Name First Page",
            'Author(s), Book Title (Publisher Year)',
            "Author(s), 'Chapter Title' in Editor(s) (ed), Book Title (Publisher Year)",
          ],
        },
      },
    ],
    version: '2.28.0',
  },
};

// 3. Article Template (Legal Article)
const ARTICLE_TEMPLATE: Template = {
  templateId: 'tmpl_article_001',
  title: 'Article',
  category: 'article',
  tags: ['article', 'legal', 'research'],
  content: {
    time: Date.now(),
    blocks: [
      {
        id: 'title_block',
        type: 'header',
        data: {
          text: 'Article Title: A Compelling Legal Analysis',
          level: 1,
        },
      },
      {
        id: 'author_info',
        type: 'paragraph',
        data: {
          text: '',
          placeholder: 'By <b>Author Name</b>, Designation/Affiliation | Date',
        },
      },
      {
        id: 'abstract_header',
        type: 'header',
        data: {
          text: '1. Abstract',
          level: 2,
        },
      },
      {
        id: 'abstract_para1',
        type: 'paragraph',
        data: {
          text: '',
          placeholder:
            'What legal issue or case does this article address? Provide a concise statement of the specific legal matter under examination. [~150-250 words]',
        },
      },
      {
        id: 'abstract_para2',
        type: 'paragraph',
        data: {
          text: '',
          placeholder:
            'Why is it significant or timely? Explain the contemporary relevance and importance of this legal issue.',
        },
      },
      {
        id: 'abstract_para3',
        type: 'paragraph',
        data: {
          text: '',
          placeholder:
            'What is your main argument or analysis? State your thesis or central position clearly.',
        },
      },
      {
        id: 'abstract_para4',
        type: 'paragraph',
        data: {
          text: '',
          placeholder:
            'What are the key conclusions or recommendations? Summarize the main findings and suggestions from your analysis.',
        },
      },
      {
        id: 'introduction_header',
        type: 'header',
        data: {
          text: '2. Introduction',
          level: 2,
        },
      },
      {
        id: 'introduction_para1',
        type: 'paragraph',
        data: {
          text: '',
          placeholder:
            "Provide a brief background or summary of the issue's origin. What events, cases, or legislative developments led to this legal question? [~200-400 words]",
        },
      },
      {
        id: 'introduction_para2',
        type: 'paragraph',
        data: {
          text: '',
          placeholder:
            'Why is the topic significant or timely? Establish the importance of this issue in current legal or social discourse, highlighting its impact on law, policy, or society.',
        },
      },
      {
        id: 'introduction_para3',
        type: 'paragraph',
        data: {
          text: '',
          placeholder:
            "What is the specific question or stance you'll explore? Clearly articulate your research question or the position you will argue in this article.",
        },
      },
      {
        id: 'discussion_header',
        type: 'header',
        data: {
          text: '3. Discussion',
          level: 2,
        },
      },
      {
        id: 'legal_framework_header',
        type: 'header',
        data: {
          text: '3.1 Legal Framework',
          level: 3,
        },
      },
      {
        id: 'legal_framework_para1',
        type: 'paragraph',
        data: {
          text: '',
          placeholder:
            'What are the relevant statutory provisions, constitutional articles, or regulations? Identify and explain the applicable legal provisions that govern this issue. [~300-600 words]',
        },
      },
      {
        id: 'legal_framework_para2',
        type: 'paragraph',
        data: {
          text: '',
          placeholder:
            'What is the brief legislative history if relevant? Discuss the evolution of the legal provisions, including any amendments, parliamentary debates, or policy considerations behind the legislation.',
        },
      },
      {
        id: 'legal_framework_para3',
        type: 'paragraph',
        data: {
          text: '',
          placeholder:
            'What are the key legal concepts and definitions? Clarify important terminology, doctrinal concepts, and legal tests or standards applicable to your analysis.',
        },
      },
      {
        id: 'legal_framework_para4',
        type: 'paragraph',
        data: {
          text: '',
          placeholder:
            'What precedent cases form the foundation? Discuss the landmark judgments and leading cases that have established the legal principles in this area.',
        },
      },
      {
        id: 'case_analysis_header',
        type: 'header',
        data: {
          text: '3.2 Case Analysis',
          level: 3,
        },
      },
      {
        id: 'case_analysis_para1',
        type: 'paragraph',
        data: {
          text: '',
          placeholder:
            'What are the facts of the case (if case comment)? Present a clear, objective summary of the factual background and circumstances. [~300-600 words]',
        },
      },
      {
        id: 'case_analysis_para2',
        type: 'paragraph',
        data: {
          text: '',
          placeholder:
            'What issues were raised before the court? Identify the legal questions and points of law that the court was called upon to decide.',
        },
      },
      {
        id: 'case_analysis_para3',
        type: 'paragraph',
        data: {
          text: '',
          placeholder:
            'What arguments were advanced by parties? Summarize the contentions, legal submissions, and reasoning presented by each side.',
        },
      },
      {
        id: 'case_analysis_para4',
        type: 'paragraph',
        data: {
          text: '',
          placeholder:
            "What was the court's reasoning and decision? Explain the court's analysis, interpretation of law, and the final judgment or order passed.",
        },
      },
      {
        id: 'case_analysis_para5',
        type: 'paragraph',
        data: {
          text: '',
          placeholder:
            'What is the ratio decidendi (binding principle)? Extract and articulate the core legal principle that emerges from the judgment and will serve as binding precedent.',
        },
      },
      {
        id: 'critical_analysis_header',
        type: 'header',
        data: {
          text: '3.3 Critical Analysis',
          level: 3,
        },
      },
      {
        id: 'critical_analysis_intro',
        type: 'paragraph',
        data: {
          text: '',
          placeholder:
            'Begin your critical evaluation of the legal issue, case, or development. Use subheadings below to organize complex analysis into digestible sections. [~500-2000 words total]',
        },
      },
      {
        id: 'critical_analysis_point1_header',
        type: 'header',
        data: {
          text: '3.3.1 [First Analytical Point]',
          level: 4,
        },
      },
      {
        id: 'critical_analysis_point1',
        type: 'paragraph',
        data: {
          text: '',
          placeholder:
            "Develop your first major analytical point. Support every claim with citations (cases, statutes, articles). Balance description with critical evaluation—don't just summarize. Use examples or hypotheticals to illustrate points. Keep paragraphs focused—one main idea per paragraph.",
        },
      },
      {
        id: 'critical_analysis_point2_header',
        type: 'header',
        data: {
          text: '3.3.2 [Second Analytical Point]',
          level: 4,
        },
      },
      {
        id: 'critical_analysis_point2',
        type: 'paragraph',
        data: {
          text: '',
          placeholder:
            "Present your second analytical argument. Consider different perspectives, evaluate the strengths and weaknesses of the court's reasoning or the existing legal framework, and assess the broader implications.",
        },
      },
      {
        id: 'critical_analysis_point3_header',
        type: 'header',
        data: {
          text: '3.3.3 [Third Analytical Point]',
          level: 4,
        },
      },
      {
        id: 'critical_analysis_point3',
        type: 'paragraph',
        data: {
          text: '',
          placeholder:
            'Continue with your third point of analysis. Engage with scholarly commentary, compare with international or comparative law perspectives, or discuss practical implications and challenges in implementation.',
        },
      },
      {
        id: 'critical_analysis_point4_header',
        type: 'header',
        data: {
          text: '3.3.4 [Fourth Analytical Point - if needed]',
          level: 4,
        },
      },
      {
        id: 'critical_analysis_point4',
        type: 'paragraph',
        data: {
          text: '',
          placeholder:
            'Add additional analytical sections as needed. Consider addressing counterarguments, discussing limitations, examining policy implications, or proposing alternative interpretations or reforms.',
        },
      },
      {
        id: 'conclusion_header',
        type: 'header',
        data: {
          text: '4. Conclusion',
          level: 2,
        },
      },
      {
        id: 'conclusion_para1',
        type: 'paragraph',
        data: {
          text: '',
          placeholder:
            'Restate your main argument (not word-for-word from introduction). What is your final position or assessment of the legal issue? [~150-300 words]',
        },
      },
      {
        id: 'conclusion_para2',
        type: 'paragraph',
        data: {
          text: '',
          placeholder:
            'Summarize key findings without introducing new information. What are the most important insights from your analysis?',
        },
      },
      {
        id: 'conclusion_para3',
        type: 'paragraph',
        data: {
          text: '',
          placeholder:
            'What are your recommendations or suggestions for reforms (if applicable)? Propose concrete steps for improving the law, policy changes, or directions for judicial development.',
        },
      },
      {
        id: 'conclusion_para4',
        type: 'paragraph',
        data: {
          text: '',
          placeholder:
            'Provide a forward-looking statement: What needs further attention? Identify unresolved questions, areas requiring legislative action, or topics for future scholarly inquiry.',
        },
      },
      {
        id: 'conclusion_para5',
        type: 'paragraph',
        data: {
          text: '',
          placeholder:
            'Final thought: Leave readers with something to ponder. Conclude with a thought-provoking observation, a call to action, or a reflection on the broader significance of your analysis.',
        },
      },
      {
        id: 'references_header',
        type: 'header',
        data: {
          text: 'References',
          level: 2,
        },
      },
      {
        id: 'references_list',
        type: 'list',
        data: {
          style: 'ordered',
          items: [
            'Case Name v Case Name [Year] Citation (Court)',
            'Legislation Title Year, Section',
            "Author(s), 'Article Title' (Year) Volume Journal Name First Page",
            'Author(s), Book Title (Edition, Publisher Year)',
            "Author(s), 'Chapter Title' in Editor (ed), Book Title (Publisher Year)",
          ],
        },
      },
    ],
    version: '2.28.0',
  },
};

export const ACADEMIC_TEMPLATES: Template[] = [
  ASSIGNMENT_TEMPLATE,
  RESEARCH_PAPER_TEMPLATE,
  ARTICLE_TEMPLATE,
];

export function getTemplateById(templateId: string): Template | undefined {
  return ACADEMIC_TEMPLATES.find((t) => t.templateId === templateId);
}

export function getTemplatesByCategory(category: DocumentType): Template[] {
  return ACADEMIC_TEMPLATES.filter((t) => t.category === category);
}

export function getAllTemplateIds(): string[] {
  return ACADEMIC_TEMPLATES.map((t) => t.templateId);
}

export function getTemplateByCategory(category: DocumentType): Template | null {
  const template = ACADEMIC_TEMPLATES.find((t) => t.category === category);
  if (!template) {
    return null;
  }
  return template;
}

export function getTemplateTags(templateId: string): string[] {
  const template = getTemplateById(templateId);
  if (!template) {
    return [];
  }
  return template.tags;
}
