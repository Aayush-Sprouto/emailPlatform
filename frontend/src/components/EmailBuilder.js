import React, { useState, useContext, useRef } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../App';
import {
  ArrowLeft,
  Save,
  Send,
  Eye,
  Smartphone,
  Monitor,
  Type,
  Image,
  Square,
  RectangleHorizontal as ButtonIcon,
  Divide,
  Settings,
  Trash2,
  Copy,
  Edit3
} from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// Drag and Drop Components
const DraggableComponent = ({ id, type, content, onEdit, onDelete, onDuplicate }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const renderComponent = () => {
    switch (type) {
      case 'heading':
        return (
          <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg bg-white">
            <h2 className="text-2xl font-bold" style={{ color: content.color || '#000' }}>
              {content.text || 'Your Heading Here'}
            </h2>
          </div>
        );
      case 'text':
        return (
          <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg bg-white">
            <p style={{ color: content.color || '#000', fontSize: content.fontSize || '14px' }}>
              {content.text || 'Your text content goes here. Click to edit this text block.'}
            </p>
          </div>
        );
      case 'image':
        return (
          <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg bg-white">
            {content.src ? (
              <img 
                src={content.src} 
                alt={content.alt || 'Email image'} 
                className="max-w-full h-auto rounded"
                style={{ width: content.width || 'auto' }}
              />
            ) : (
              <div className="bg-gray-200 h-32 flex items-center justify-center rounded">
                <Image className="h-8 w-8 text-gray-400" />
                <span className="ml-2 text-gray-500">Click to add image</span>
              </div>
            )}
          </div>
        );
      case 'button':
        return (
          <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg bg-white">
            <button
              className="px-6 py-2 rounded font-medium"
              style={{
                backgroundColor: content.backgroundColor || '#3B82F6',
                color: content.textColor || '#FFFFFF'
              }}
            >
              {content.text || 'Click Here'}
            </button>
          </div>
        );
      case 'divider':
        return (
          <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg bg-white">
            <hr 
              className="border-t"
              style={{ 
                borderColor: content.color || '#E5E7EB',
                borderWidth: content.thickness || '1px'
              }}
            />
          </div>
        );
      default:
        return (
          <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg bg-white">
            <p>Unknown component type</p>
          </div>
        );
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="relative group mb-4"
    >
      {renderComponent()}
      
      {/* Component Controls */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(id);
          }}
          className="p-1 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          <Edit3 className="h-3 w-3" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDuplicate(id);
          }}
          className="p-1 bg-green-600 text-white rounded hover:bg-green-700"
        >
          <Copy className="h-3 w-3" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(id);
          }}
          className="p-1 bg-red-600 text-white rounded hover:bg-red-700"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
};

// Component Library
const componentLibrary = [
  { type: 'heading', icon: Type, label: 'Heading', defaultContent: { text: 'Your Heading Here', color: '#000000' } },
  { type: 'text', icon: Type, label: 'Text Block', defaultContent: { text: 'Your text content goes here.', color: '#000000', fontSize: '14px' } },
  { type: 'image', icon: Image, label: 'Image', defaultContent: { src: '', alt: '', width: '100%' } },
  { type: 'button', icon: ButtonIcon, label: 'Button', defaultContent: { text: 'Click Here', backgroundColor: '#3B82F6', textColor: '#FFFFFF' } },
  { type: 'divider', icon: Divide, label: 'Divider', defaultContent: { color: '#E5E7EB', thickness: '1px' } },
];

const EmailBuilder = () => {
  const { apiKey } = useContext(AuthContext);
  const [emailData, setEmailData] = useState({
    subject: 'New Email Campaign',
    from_email: 'noreply@emailplatform.com',
    from_name: 'Your Company'
  });
  const [components, setComponents] = useState([]);
  const [previewMode, setPreviewMode] = useState('desktop'); // desktop, mobile
  const [editingComponent, setEditingComponent] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const fileInputRef = useRef(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const addComponent = (type) => {
    const componentDef = componentLibrary.find(c => c.type === type);
    const newComponent = {
      id: `${type}-${Date.now()}`,
      type,
      content: { ...componentDef.defaultContent }
    };
    setComponents([...components, newComponent]);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setComponents((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const editComponent = (id) => {
    const component = components.find(c => c.id === id);
    setEditingComponent(component);
  };

  const updateComponent = (updatedComponent) => {
    setComponents(components.map(c => 
      c.id === updatedComponent.id ? updatedComponent : c
    ));
    setEditingComponent(null);
  };

  const deleteComponent = (id) => {
    setComponents(components.filter(c => c.id !== id));
  };

  const duplicateComponent = (id) => {
    const component = components.find(c => c.id === id);
    if (component) {
      const duplicated = {
        ...component,
        id: `${component.type}-${Date.now()}`
      };
      const index = components.findIndex(c => c.id === id);
      const newComponents = [...components];
      newComponents.splice(index + 1, 0, duplicated);
      setComponents(newComponents);
    }
  };

  const generateEmailHTML = () => {
    let html = `
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${emailData.subject}</title>
        </head>
        <body style="margin: 0; padding: 20px; font-family: Arial, sans-serif; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
    `;

    components.forEach(component => {
      switch (component.type) {
        case 'heading':
          html += `<div style="padding: 16px;"><h2 style="color: ${component.content.color}; margin: 0;">${component.content.text}</h2></div>`;
          break;
        case 'text':
          html += `<div style="padding: 16px;"><p style="color: ${component.content.color}; font-size: ${component.content.fontSize}; margin: 0; line-height: 1.6;">${component.content.text}</p></div>`;
          break;
        case 'image':
          if (component.content.src) {
            html += `<div style="padding: 16px;"><img src="${component.content.src}" alt="${component.content.alt}" style="max-width: 100%; height: auto; display: block;"></div>`;
          }
          break;
        case 'button':
          html += `<div style="padding: 16px; text-align: center;"><a href="#" style="display: inline-block; padding: 12px 24px; background-color: ${component.content.backgroundColor}; color: ${component.content.textColor}; text-decoration: none; border-radius: 4px; font-weight: bold;">${component.content.text}</a></div>`;
          break;
        case 'divider':
          html += `<div style="padding: 16px;"><hr style="border: none; border-top: ${component.content.thickness} solid ${component.content.color}; margin: 0;"></div>`;
          break;
      }
    });

    html += `
          </div>
        </body>
      </html>
    `;

    return html;
  };

  const handleSend = async () => {
    if (!apiKey) {
      alert('Please configure your API key first');
      return;
    }

    const htmlContent = generateEmailHTML();
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/v1/emails`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from_email: emailData.from_email,
          from_name: emailData.from_name,
          to: [{ email: 'test@example.com', name: 'Test User' }],
          subject: emailData.subject,
          html_content: htmlContent,
          tags: ['email-builder'],
          send_immediately: true
        })
      });
      
      if (response.ok) {
        alert('Email sent successfully!');
      } else {
        alert('Failed to send email');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      alert('Error sending email');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link to="/" className="mr-4">
              <ArrowLeft className="h-6 w-6 text-gray-600 hover:text-gray-900" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Email Builder</h1>
              <input
                type="text"
                value={emailData.subject}
                onChange={(e) => setEmailData({...emailData, subject: e.target.value})}
                className="text-sm text-gray-600 bg-transparent border-none outline-none hover:bg-gray-50 px-2 py-1 rounded"
                placeholder="Email subject..."
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setPreviewMode('desktop')}
                className={`p-2 rounded ${previewMode === 'desktop' ? 'bg-white shadow' : ''}`}
              >
                <Monitor className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPreviewMode('mobile')}
                className={`p-2 rounded ${previewMode === 'mobile' ? 'bg-white shadow' : ''}`}
              >
                <Smartphone className="h-4 w-4" />
              </button>
            </div>
            
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 bg-gray-100 rounded hover:bg-gray-200"
            >
              <Settings className="h-4 w-4" />
            </button>
            
            <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 flex items-center">
              <Save className="h-4 w-4 mr-2" />
              Save
            </button>
            
            <button
              onClick={handleSend}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
            >
              <Send className="h-4 w-4 mr-2" />
              Send Test
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Component Library Sidebar */}
        <div className="w-64 bg-white border-r border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Components</h3>
          <div className="space-y-2">
            {componentLibrary.map((component) => (
              <button
                key={component.type}
                onClick={() => addComponent(component.type)}
                className="w-full flex items-center p-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <component.icon className="h-5 w-5 text-gray-600 mr-3" />
                <span className="text-sm font-medium text-gray-900">{component.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Email Canvas */}
        <div className="flex-1 p-6">
          <div className={`mx-auto bg-white rounded-lg shadow-lg ${previewMode === 'mobile' ? 'max-w-sm' : 'max-w-2xl'}`}>
            <div className="p-6">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={components.map(c => c.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {components.length === 0 ? (
                    <div className="text-center py-16">
                      <Type className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 mb-2">Start building your email</p>
                      <p className="text-sm text-gray-400">Drag components from the sidebar to get started</p>
                    </div>
                  ) : (
                    components.map((component) => (
                      <DraggableComponent
                        key={component.id}
                        id={component.id}
                        type={component.type}
                        content={component.content}
                        onEdit={editComponent}
                        onDelete={deleteComponent}
                        onDuplicate={duplicateComponent}
                      />
                    ))
                  )}
                </SortableContext>
              </DndContext>
            </div>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="w-80 bg-white border-l border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Email Settings</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From Name</label>
                <input
                  type="text"
                  value={emailData.from_name}
                  onChange={(e) => setEmailData({...emailData, from_name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From Email</label>
                <input
                  type="email"
                  value={emailData.from_email}
                  onChange={(e) => setEmailData({...emailData, from_email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Component Editor Modal */}
      {editingComponent && (
        <ComponentEditor
          component={editingComponent}
          onSave={updateComponent}
          onClose={() => setEditingComponent(null)}
        />
      )}
    </div>
  );
};

// Component Editor Modal
const ComponentEditor = ({ component, onSave, onClose }) => {
  const [content, setContent] = useState({ ...component.content });

  const handleSave = () => {
    onSave({ ...component, content });
  };

  const renderEditor = () => {
    switch (component.type) {
      case 'heading':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Heading Text</label>
              <input
                type="text"
                value={content.text}
                onChange={(e) => setContent({...content, text: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
              <input
                type="color"
                value={content.color}
                onChange={(e) => setContent({...content, color: e.target.value})}
                className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        );
        
      case 'text':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Text Content</label>
              <textarea
                value={content.text}
                onChange={(e) => setContent({...content, text: e.target.value})}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Text Color</label>
              <input
                type="color"
                value={content.color}
                onChange={(e) => setContent({...content, color: e.target.value})}
                className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Font Size</label>
              <select
                value={content.fontSize}
                onChange={(e) => setContent({...content, fontSize: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="12px">12px</option>
                <option value="14px">14px</option>
                <option value="16px">16px</option>
                <option value="18px">18px</option>
                <option value="20px">20px</option>
                <option value="24px">24px</option>
              </select>
            </div>
          </div>
        );
        
      case 'button':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Button Text</label>
              <input
                type="text"
                value={content.text}
                onChange={(e) => setContent({...content, text: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Background Color</label>
              <input
                type="color"
                value={content.backgroundColor}
                onChange={(e) => setContent({...content, backgroundColor: e.target.value})}
                className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Text Color</label>
              <input
                type="color"
                value={content.textColor}
                onChange={(e) => setContent({...content, textColor: e.target.value})}
                className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        );
        
      default:
        return <p>No editor available for this component type.</p>;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-96">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Edit {component.type}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ×
          </button>
        </div>
        
        {renderEditor()}
        
        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailBuilder;