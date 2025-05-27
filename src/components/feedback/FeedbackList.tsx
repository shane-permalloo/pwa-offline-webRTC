import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Bug, Lightbulb, Edit2, Trash2, ThumbsUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { FeedbackItem } from '../../types';
import { useFeedback } from '../../contexts/FeedbackContext';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';

interface FeedbackListProps {
  onEdit: (feedbackItem: FeedbackItem) => void;
}

const ITEMS_PER_PAGE = 10;

const FeedbackList: React.FC<FeedbackListProps> = ({ onEdit }) => {
  const { feedbackItems, deleteFeedback, toggleUpvote, userCanEdit, hasUpvoted, isLoading } = useFeedback();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const prevItemsRef = useRef<FeedbackItem[]>([]);

  // Use a stable reference for items to prevent unnecessary re-renders
  useEffect(() => {
    prevItemsRef.current = feedbackItems;
  }, [feedbackItems]);

  const filteredItems = useMemo(() => {
    return feedbackItems.filter(item => {
      const matchesSearch = 
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.createdBy.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = 
        filterType === 'all' || 
        item.type === filterType;
      
      return matchesSearch && matchesType;
    });
  }, [feedbackItems, searchTerm, filterType]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType]);

  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
  
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredItems, currentPage]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this feedback?')) {
      await deleteFeedback(id);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  if (isLoading && prevItemsRef.current.length === 0) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 bg-primary-200 rounded-full mb-2"></div>
          <div className="h-4 w-32 bg-primary-100 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="Search feedback..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="flex-1"
          fullWidth
        />
        <Select
          label=""
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          options={[
            { value: 'all', label: 'All Types' },
            { value: 'bug', label: 'Bugs' },
            { value: 'suggestion', label: 'Suggestions' },
          ]}
          className="w-full sm:w-40"
        />
      </div>
      
      {filteredItems.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
          <p className="text-gray-500 dark:text-gray-400">No feedback items found.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {paginatedItems.map(item => (
              <div 
                key={`feedback-${item.id}`}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg"
              >
                <div className="p-6 flex">
                  {/* Upvote column - left side */}
                  <div className="flex flex-col items-center mr-4">
                    <Button
                      variant={hasUpvoted(item) ? 'primary' : 'outline'}
                      size="lg"
                      onClick={() => toggleUpvote(item.id)}
                      className="flex flex-col items-center p-3 transition-colors duration-300 relative z-10"
                    >
                      <ThumbsUp size={24} />
                      <span className="mt-1 font-bold text-lg transition-all duration-300">{item.upvotes.length}</span>
                    </Button>
                    
                    {userCanEdit(item) && (
                      <div className="flex flex-row border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden pt-2 relative -inset-y-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(item)}
                          icon={<Edit2 size={16} />}
                          aria-label="Edit"
                          className="text-indigo-600 hover:text-indigo-700 transition transition-colors duration-300"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(item.id)}
                          className="text-error-600 hover:text-error-700 transition-colors duration-300"
                          icon={<Trash2 size={16} />}
                          aria-label="Delete"
                        />
                      </div>
                    )}
                  </div>
                  
                  {/* Content column - right side */}
                  <div className="flex-1">
                    <div className="flex items-center">
                      {item.type === 'bug' ? (
                        <Badge variant="warning" className="flex items-center">
                          <Bug size={12} className="mr-1" />
                          Bug
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="flex items-center">
                          <Lightbulb size={12} className="mr-1" />
                          Suggestion
                        </Badge>
                      )}
                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                        {formatDate(item.createdAt)}
                      </span>
                    </div>
                    <h3 className="mt-2 text-lg font-semibold">{item.title}</h3>
                    <p className="mt-2 text-gray-600 dark:text-gray-300 whitespace-pre-line">
                      {item.description}
                    </p>
                    <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                      By <span className="font-medium">{item.createdBy}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Pagination controls */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-6">
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  icon={<ChevronLeft size={16} />}
                  aria-label="Previous page"
                />
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <Button
                      key={`page-${page}`}
                      variant={currentPage === page ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className="min-w-[2.5rem]"
                    >
                      {page}
                    </Button>
                  ))}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  icon={<ChevronRight size={16} />}
                  aria-label="Next page"
                />
              </div>
            </div>
          )}
          
          <div className="text-center text-sm text-gray-500 dark:text-gray-400 mt-2">
            Showing {paginatedItems.length} of {filteredItems.length} items
          </div>
        </>
      )}
    </div>
  );
};

export default FeedbackList;






