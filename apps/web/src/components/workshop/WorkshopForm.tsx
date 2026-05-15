import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import { Button } from '../ui/Button';
import type { AdminWorkshop, CreateWorkshopPayload } from '../../stores/adminWorkshopStore';

// Dynamic validation builder based on mode to prevent locking out post-launch edits
const getWorkshopSchema = (isEdit: boolean) => z
  .object({
    title: z.string().trim().min(1, 'Title is required'),
    description: z.string().trim().optional().or(z.literal('')),
    speakerName: z.string().trim().optional().or(z.literal('')),
    location: z.string().trim().optional().or(z.literal('')),
    startTime: z.string().min(1, 'Start time is required'),
    endTime: z.string().min(1, 'End time is required'),
    capacity: z.number({ message: 'Capacity must be a number' })
      .int('Capacity must be a whole number')
      .positive('Capacity must be greater than 0'),
    price: z.number({ message: 'Price must be a number' })
      .min(0, 'Price cannot be negative'),
    roomLayoutUrl: z
      .string()
      .trim()
      .optional()
      .or(z.literal(''))
      .refine((val) => !val || /^https?:\/\/.+/.test(val), {
        message: 'Must be a valid URL starting with http:// or https://',
      }),
    pdfUrl: z
      .string()
      .trim()
      .optional()
      .or(z.literal(''))
      .refine((val) => !val || /^https?:\/\/.+/.test(val), {
        message: 'Must be a valid URL starting with http:// or https://',
      }),
    status: z.enum(['DRAFT', 'PUBLISHED', 'CANCELLED']),
  })
  .refine((data) => {
    if (isEdit) return true; // Don't force old workshops to have future start dates on modification
    if (!data.startTime) return true;
    return new Date(data.startTime) > new Date();
  }, {
    message: 'Start time must be in the future',
    path: ['startTime'],
  })
  .refine((data) => {
    if (!data.startTime || !data.endTime) return true;
    return new Date(data.endTime) > new Date(data.startTime);
  }, {
    message: 'End time must be after start time',
    path: ['endTime'],
  });

type WorkshopFormValues = z.infer<ReturnType<typeof getWorkshopSchema>>;

interface WorkshopFormProps {
  initialData?: AdminWorkshop | null;
  onSubmit: (data: CreateWorkshopPayload) => Promise<void>;
  submitText?: string;
}

// Helper helper to format ISO string -> YYYY-MM-DDTHH:mm
const formatToDatetimeLocal = (isoString?: string | null): string => {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
    const pad = (n: number) => String(n).padStart(2, '0');
    const yyyy = date.getFullYear();
    const MM = pad(date.getMonth() + 1);
    const dd = pad(date.getDate());
    const hh = pad(date.getHours());
    const mm = pad(date.getMinutes());
    return `${yyyy}-${MM}-${dd}T${hh}:${mm}`;
  } catch (e) {
    return '';
  }
};

export const WorkshopForm: React.FC<WorkshopFormProps> = ({
  initialData,
  onSubmit,
  submitText = 'Save Workshop',
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<WorkshopFormValues>({
    resolver: zodResolver(getWorkshopSchema(!!initialData)),
    defaultValues: {
      title: '',
      description: '',
      speakerName: '',
      location: '',
      startTime: '',
      endTime: '',
      capacity: undefined,
      price: 0,
      roomLayoutUrl: '',
      pdfUrl: '',
      status: 'DRAFT',
    },
  });

  // Re-populate defaults on initialData loads (e.g. Edit mode)
  useEffect(() => {
    if (initialData) {
      reset({
        title: initialData.title || '',
        description: initialData.description || '',
        speakerName: initialData.speakerName || '',
        location: initialData.location || '',
        startTime: formatToDatetimeLocal(initialData.startTime),
        endTime: formatToDatetimeLocal(initialData.endTime),
        capacity: initialData.capacity,
        price: initialData.price,
        roomLayoutUrl: initialData.roomLayoutUrl || '',
        pdfUrl: initialData.pdfUrl || '',
        status: initialData.status,
      });
    }
  }, [initialData, reset]);

  const onFormSubmit = async (values: WorkshopFormValues) => {
    try {
      const payload: CreateWorkshopPayload = {
        title: values.title,
        description: values.description?.trim() || undefined,
        speakerName: values.speakerName?.trim() || undefined,
        location: values.location?.trim() || undefined,
        startTime: new Date(values.startTime).toISOString(),
        endTime: new Date(values.endTime).toISOString(),
        capacity: values.capacity,
        price: values.price,
        roomLayoutUrl: values.roomLayoutUrl?.trim() || undefined,
        pdfUrl: values.pdfUrl?.trim() || undefined,
        status: values.status,
      };
      await onSubmit(payload);
    } catch (err) {
      // Handled in the parent page for UI notifications
    }
  };

  const statusOptions = [
    { value: 'DRAFT', label: 'Draft' },
    { value: 'PUBLISHED', label: 'Published' },
    { value: 'CANCELLED', label: 'Cancelled' },
  ];

  const formGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '24px',
    marginBottom: '32px',
  };

  const fullWidthStyle: React.CSSProperties = {
    gridColumn: '1 / -1',
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} style={{ width: '100%', maxWidth: '800px' }}>
      <div style={formGridStyle}>
        <div style={fullWidthStyle}>
          <Input
            label="Workshop Title *"
            error={errors.title?.message}
            placeholder="e.g., Advanced React Patterns Masterclass"
            {...register('title')}
          />
        </div>

        <div style={fullWidthStyle}>
          <Textarea
            label="Description"
            error={errors.description?.message}
            placeholder="Write a detailed overview of the workshop session..."
            {...register('description')}
          />
        </div>

        <Input
          label="Speaker Name"
          error={errors.speakerName?.message}
          placeholder="e.g., Dr. Jane Doe"
          {...register('speakerName')}
        />

        <Input
          label="Location / Room"
          error={errors.location?.message}
          placeholder="e.g., Amphitheater 4A or Online"
          {...register('location')}
        />

        <Input
          label="Start Time *"
          type="datetime-local"
          error={errors.startTime?.message}
          {...register('startTime')}
        />

        <Input
          label="End Time *"
          type="datetime-local"
          error={errors.endTime?.message}
          {...register('endTime')}
        />

        <Input
          label="Capacity *"
          type="number"
          placeholder="10"
          error={errors.capacity?.message}
          {...register('capacity', { valueAsNumber: true })}
        />

        <Input
          label="Price ($)"
          type="number"
          step="0.01"
          placeholder="0.00"
          error={errors.price?.message}
          {...register('price', { valueAsNumber: true })}
        />

        <Input
          label="Room Layout Image URL"
          placeholder="https://example.com/layout.png"
          error={errors.roomLayoutUrl?.message}
          {...register('roomLayoutUrl')}
        />

        <Input
          label="Workshop Info PDF URL"
          placeholder="https://example.com/syllabus.pdf"
          error={errors.pdfUrl?.message}
          {...register('pdfUrl')}
        />

        <div style={fullWidthStyle}>
          <Select
            label="Status"
            options={statusOptions}
            error={errors.status?.message}
            {...register('status')}
          />
        </div>
      </div>

      <Button 
        type="submit" 
        loading={isSubmitting} 
        style={{ width: 'auto', minWidth: '200px', padding: '12px 32px' }}
      >
        {submitText}
      </Button>
    </form>
  );
};
