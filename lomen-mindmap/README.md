# AI-Native Learning Workspace - Mind Map Generator

A full-stack web application that automatically generates interactive mind maps from PDF documents using AI-powered content analysis with progressive disclosure (click to expand nodes).

## Features

- **PDF Upload & Processing**: Upload PDF documents and extract text content
- **AI-Powered Structuring**: Uses LLM (OpenAI GPT-3.5) to intelligently structure content into hierarchical mind maps
- **Progressive Disclosure**: Click on nodes to expand/collapse subtopics for a clean, organized view
- **Interactive Mind Map Canvas**: 
  - Infinite canvas with pan and zoom
  - Drag and drop node repositioning
  - Smooth curved edges between nodes
  - Click nodes with children to expand/collapse
- **Color-Coded Hierarchy**:
  - Purple: Root topic
  - Teal: Main topics
  - Green: Sub-topics
  - Orange: Details
- **Modern Dark Mode UI**: Sleek interface with navigation controls
- **Export Functionality**: Download mind maps as JSON files
- **Responsive Controls**: Floating zoom controls and helper text

## Tech Stack

### Backend
- **Express.js**: Node.js web framework for API endpoints
- **pdf-parse**: PDF text extraction
- **OpenAI API**: AI-powered content structuring (optional - fallback mode available)
- **Node.js 16+**

### Frontend
- **React 18**: UI framework
- **React Flow**: Interactive node graph library
- **TailwindCSS**: Styling
- **Vite**: Build tool

## Setup Instructions

### Prerequisites
- Node.js 16+
- OpenAI API key (optional - fallback mode available)

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install Node dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Add your OpenAI API key to `.env` (optional):
```
OPENAI_API_KEY=your_api_key_here
PORT=8000
```

5. Start the backend server:
```bash
npm start
```

The backend will run on `http://localhost:8000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install Node dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

## Usage

1. Open the application in your browser at `http://localhost:5173`
2. Use the navigation bar to select Week and Lesson (optional)
3. Click "Upload PDF" to select a PDF file
4. The application will:
   - Extract text from the PDF
   - Use AI to structure the content into a hierarchical mind map
   - Display only the root topic initially
5. Interact with the mind map:
   - **Click on nodes with (+) to expand** and show their children
   - **Click on expanded nodes to collapse** and hide their children
   - Drag the background to pan
   - Scroll to zoom in/out
   - Drag individual nodes to reposition them
   - Use the +/- buttons for zoom control
   - Click the reset button to re-center the view
6. Click "Download" to export the current mind map state as JSON

## Project Structure

```
mind_map/
├── backend/
│   ├── server.js            # Express application with PDF processing
│   ├── package.json         # Node dependencies
│   ├── .env.example         # Environment variables template
│   └── .env                 # Your environment variables
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # Main React component with progressive disclosure
│   │   ├── App.css          # Component styles
│   │   ├── index.css        # Global styles with Tailwind
│   │   └── main.jsx         # React entry point
│   ├── package.json         # Node dependencies
│   ├── tailwind.config.js   # Tailwind configuration
│   └── postcss.config.js    # PostCSS configuration
└── README.md               # This file
```

## API Endpoints

### POST /api/upload-pdf
Upload a PDF file and generate a mind map structure (root node only).

**Request**: 
- Method: POST
- Content-Type: multipart/form-data
- Body: file (PDF)

**Response**:
```json
{
  "nodes": [
    {
      "id": "root",
      "data": { 
        "label": "Main Topic", 
        "level": 0,
        "hasChildren": true,
        "childPositions": [...]
      },
      "position": { "x": 0, "y": 0 },
      "type": "custom"
    }
  ],
  "edges": []
}
```

### POST /api/get-children
Get children of a specific node for progressive disclosure.

**Request**: 
- Method: POST
- Content-Type: application/json
- Body: 
```json
{
  "nodeId": "node_id",
  "childData": { "childPositions": [...] }
}
```

**Response**:
```json
{
  "nodes": [
    {
      "id": "child_1",
      "data": { 
        "label": "Child Topic", 
        "level": 1,
        "hasChildren": true
      },
      "position": { "x": 300, "y": 200 },
      "type": "custom"
    }
  ],
  "edges": [
    {
      "id": "node_id-child_1",
      "source": "node_id",
      "target": "child_1",
      "type": "smoothstep"
    }
  ]
}
```

## Features in Detail

### Progressive Disclosure
- **Initial View**: Only the root topic is displayed after PDF upload
- **Click to Expand**: Nodes with children show a (+) indicator and can be clicked to reveal their children
- **Click to Collapse**: Expanded nodes can be collapsed to hide their children and clean up the view
- **Visual Indicators**: Nodes with children display a (+) badge to indicate expandability

### Mind Map Canvas
- **Infinite Canvas**: Pan by dragging the background, zoom with scroll wheel
- **Node Styling**: Pill-shaped nodes with rounded corners and color coding
- **Interactive Edges**: Smooth curved connections that update when nodes move
- **MiniMap**: Overview of the entire mind map structure

### Navigation Controls
- **Week/Lesson Dropdowns**: Select specific content (placeholder for future filtering)
- **Go Button**: Trigger content loading based on selection
- **Upload PDF**: Select and upload PDF files for processing
- **Download**: Export current mind map state as JSON

### Color Hierarchy
- **Level 0 (Root)**: Purple (#9333ea) - Main document topic
- **Level 1 (Main)**: Teal (#0d9488) - Major sections/chapters
- **Level 2 (Sub)**: Green (#22c55e) - Key concepts within sections
- **Level 3 (Detail)**: Orange (#f97316) - Specific points and examples

## Fallback Mode

If no OpenAI API key is provided, the application uses a rule-based fallback that:
- Extracts text from PDFs
- Creates a simple hierarchical structure based on heading detection
- Generates basic mind maps without AI analysis
- Detects ALL CAPS headings and contextual structure

## Troubleshooting

### Backend Issues
- Ensure Node.js 16+ is installed
- Check that all dependencies are installed: `npm install`
- Verify the backend is running on port 8000

### Frontend Issues
- Ensure Node.js 16+ is installed
- Check that dependencies are installed: `npm install`
- Verify the frontend is running on port 5173
- Check browser console for errors

### PDF Processing Issues
- Ensure PDF files contain extractable text (not scanned images)
- Try with smaller PDF files first
- Check backend logs for detailed error messages

### CORS Issues
- The backend is configured to allow requests from localhost:3000 and localhost:5173
- If using different ports, update the CORS configuration in `backend/server.js`

## Future Enhancements

- [ ] User authentication and saved mind maps
- [ ] Multiple export formats (PNG, SVG, PDF)
- [ ] Collaborative editing
- [ ] More sophisticated AI analysis with different models
- [ ] Integration with learning management systems
- [ ] Voice commands for navigation
- [ ] Mobile-responsive design
- [ ] Auto-save and restore mind map states

## License

This project is open source and available for educational purposes.

## Acknowledgments

- Built for hackathon project
- Uses React Flow for interactive graph visualization
- Powered by OpenAI GPT-3.5 for content analysis
- Progressive disclosure pattern for better UX
 # Hello