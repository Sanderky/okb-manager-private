import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { useScroll } from '@/shared/lib/ScrollContext';
import { EVENT_CATEGORIES, type EventCategory, type InfoEvent } from '@/entities/events';

const EVENTS_FILTER_STORAGE_KEY = 'eventsBox_filters';

interface UseUpcomingEventsProps {
  events: InfoEvent[];
  type: 'all' | 'employee' | 'construction';
}

export const useUpcomingEventsFacade = ({ type, events: upcomingEvents }: UseUpcomingEventsProps) => {
  const navigate = useNavigate();
  const { scrollToTop: scrollToTopFn } = useScroll();

  const [selectedCategories, setSelectedCategories] = useState<EventCategory[]>(() => {
    try {
      const saved = localStorage.getItem(EVENTS_FILTER_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (error) {
      console.error('Błąd odczytu filtrów z localStorage', error);
    }
    return EVENT_CATEGORIES;
  });

  useEffect(() => {
    localStorage.setItem(EVENTS_FILTER_STORAGE_KEY, JSON.stringify(selectedCategories));
  }, [selectedCategories]);

  const handleFilterChange = (category: EventCategory) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    );
  };

  const filteredEvents = useMemo(() => {
    return upcomingEvents.filter((event) => selectedCategories.includes(event.category));
  }, [upcomingEvents, selectedCategories]);

  const getTitle = () => {
    if (type === 'construction') return 'Wydarzenia na budowie';
    if (type === 'employee') return 'Wydarzenia pracownika';
    return 'Nadchodzące wydarzenia';
  };

  const filtersActive = selectedCategories.length !== EVENT_CATEGORIES.length;

  const handleEventClick = (event: InfoEvent, scrollToTop = false) => {
    const startMonth = dayjs(event.startDate).format('YYYY-MM');
    navigate(`/calendar?month=${startMonth}&eventId=${event.id}`);
    if (scrollToTop) scrollToTopFn();
  };

  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  const handleOpenPopover = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClosePopover = () => {
    setAnchorEl(null);
  };

  const popoverOpen = Boolean(anchorEl);
  const popoverId = popoverOpen ? 'upcoming-events-popover' : undefined;

  return {
    filteredEvents,
    getTitle,
    filtersActive,
    selectedCategories,
    handleFilterChange,
    handleEventClick,
    popoverId,
    popoverOpen,
    anchorEl,
    handleOpenPopover,
    handleClosePopover,
  };
};