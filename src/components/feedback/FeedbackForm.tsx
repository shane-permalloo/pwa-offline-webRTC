import React, { useState, useEffect } from 'react';
import { Bug, Lightbulb, X } from 'lucide-react';
import { FeedbackItem, IssueType } from '../../types';
import { useFeedback } from '../../contexts/FeedbackContext';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Textarea from '../ui/Textarea';

interface FeedbackFormProps {
  feedbackItem?: FeedbackItem;
  onCancel: () => void;
}

const FeedbackForm: React.FC<FeedbackFormProps> = ({ feedbackItem, onCancel }) => {
  const { createFeedback, updateFeedback } = useFeedback();
  const [type, setType] = useState<IssueType>('bug');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ title?: string; description?: string }>({});

  useEffect(() => {
    if (feedbackItem) {
      setType(feedbackItem.type);
      setTitle(feedbackItem.title);
      setDescription(feedbackItem.description);
    }
  }, [feedbackItem]);

  const validate = () => {
    const newErrors: { title?: string; description?: string } = {};
    
    if (!title.trim()) {
      newErrors.title = 'Title is required';
    } else if (title.length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    }
    
    if (!description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      if (feedbackItem) {
        // Update existing feedback
        await updateFeedback(feedbackItem.id, {
          type,
          title,
          description,
        });
      } else {
        // Create new feedback
        await createFeedback(type, title, description);
      }
      
      // Reset form
      if (!feedbackItem) {
        setType('bug');
        setTitle('');
        setDescription('');
      }
      
      onCancel();
    } catch (error) {
      console.error('Error submitting feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 animate-slide-up">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">
          {feedbackItem ? 'Edit Feedback' : 'New Feedback'}
        </h2>
        <Button
          variant="ghost"
          size="sm"
          className="align-right"
          onClick={onCancel}
          icon={<X size={18} />}
          aria-label="Close"
        />
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <div className="flex space-x-4">
            <Button
              type="button"
              variant={type === 'bug' ? 'danger' : 'outline'}
              onClick={() => setType('bug')}
              className="flex-1"
              icon={<Bug size={16} />}
            >
              <span className='ml-2'>Bug</span>
            </Button>
            <Button
              type="button"
              variant={type === 'suggestion' ? 'secondary' : 'outline'}
              onClick={() => setType('suggestion')}
              className="flex-1"
              icon={<Lightbulb size={16} />}
            >
              <span className='ml-2'>Suggestion</span>
            </Button>
          </div>
        </div>
        
        <div className="mb-4">
          <Input
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter a descriptive title"
            error={errors.title}
            fullWidth
            required
          />
        </div>
        
        <div className="mb-6">
          <Textarea
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Provide details about the issue or suggestion"
            rows={4}
            error={errors.description}
            fullWidth
            required
          />
        </div>
        
        <div className="flex justify-end space-x-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
          >
            {feedbackItem ? 'Update' : 'Submit'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default FeedbackForm;