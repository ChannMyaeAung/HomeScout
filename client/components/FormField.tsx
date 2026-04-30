"use client";

import React from "react";
import {
  Controller,
  useFormContext,
  useFieldArray,
  type ControllerRenderProps,
  type FieldValues,
} from "react-hook-form";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Edit, X, Plus } from "lucide-react";
import { registerPlugin } from "filepond";
import { FilePond } from "react-filepond";
import "filepond/dist/filepond.min.css";
import FilePondPluginImagePreview from "filepond-plugin-image-preview";
import FilePondPluginImageExifOrientation from "filepond-plugin-image-exif-orientation";
import "filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css";

registerPlugin(FilePondPluginImageExifOrientation, FilePondPluginImagePreview);

interface FormFieldProps {
  name: string;
  label: string;
  type?:
    | "text"
    | "email"
    | "textarea"
    | "number"
    | "select"
    | "switch"
    | "password"
    | "file"
    | "multi-input";
  placeholder?: string;
  options?: { value: string; label: string }[];
  accept?: string;
  className?: string;
  labelClassName?: string;
  inputClassName?: string;
  value?: string;
  disabled?: boolean;
  multiple?: boolean;
  isIcon?: boolean;
  initialValue?: string | number | boolean | string[];
}

export const CustomFormField: React.FC<FormFieldProps> = ({
  name,
  label,
  type = "text",
  placeholder,
  options,
  className,
  inputClassName,
  labelClassName,
  disabled = false,
  multiple = false,
  isIcon = false,
  initialValue,
}) => {
  const { control } = useFormContext();

  const renderInput = (field: ControllerRenderProps<FieldValues, string>) => {
    switch (type) {
      case "textarea":
        return (
          <Textarea
            placeholder={placeholder}
            {...field}
            rows={3}
            className={`border-gray-200 p-4 ${inputClassName}`}
          />
        );
      case "select":
        return (
          <Select
            value={field.value || (initialValue as string)}
            defaultValue={field.value || (initialValue as string)}
            onValueChange={field.onChange}
          >
            <SelectTrigger
              className={`w-full border-gray-200 p-4 ${inputClassName}`}
            >
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent className="w-full border-gray-200 shadow">
              {options?.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  className="cursor-pointer hover:bg-gray-100! hover:text-customgreys-darkGrey!"
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case "switch":
        return (
          <div className="flex items-center space-x-2">
            <Switch
              checked={field.value}
              onCheckedChange={field.onChange}
              id={name}
              className={`text-customgreys-dirtyGrey ${inputClassName}`}
            />
            <FieldLabel htmlFor={name} className={labelClassName}>
              {label}
            </FieldLabel>
          </div>
        );
      case "file":
        return (
          <FilePond
            className={inputClassName}
            onupdatefiles={(fileItems) => {
              field.onChange(fileItems.map((fi) => fi.file));
            }}
            allowMultiple={true}
            labelIdle={`Drag & Drop your images or <span class="filepond--label-action">Browse</span>`}
            credits={false}
          />
        );
      case "number":
        return (
          <Input
            type="number"
            placeholder={placeholder}
            {...field}
            className={`border-gray-200 p-4 ${inputClassName}`}
            disabled={disabled}
          />
        );
      case "multi-input":
        return (
          <MultiInputField
            name={name}
            control={control}
            placeholder={placeholder}
            inputClassName={inputClassName}
          />
        );
      default:
        return (
          <Input
            type={type}
            placeholder={placeholder}
            {...field}
            className={`border-gray-200 py-6 px-4 ${inputClassName}`}
            disabled={disabled}
          />
        );
    }
  };

  return (
    <Controller
      control={control}
      name={name}
      defaultValue={initialValue}
      render={({ field, fieldState: { error } }) => (
        <Field
          data-invalid={!!error}
          className={`${type !== "switch" ? "rounded-md" : ""} relative space-y-6 ${className}`}
        >
          {type !== "switch" && (
            <div className="flex items-center justify-between space-x-6">
              <FieldLabel className={`text-sm ${labelClassName}`}>
                {label}
              </FieldLabel>
              {!disabled &&
                isIcon &&
                type !== "file" &&
                type !== "multi-input" && (
                  <Edit className="size-4 text-customgreys-dirtyGrey" />
                )}
            </div>
          )}

          {renderInput({
            ...field,
            value: field.value !== undefined ? field.value : initialValue,
          } as ControllerRenderProps<FieldValues, string>)}

          <FieldError errors={error ? [error] : []} />
        </Field>
      )}
    />
  );
};

interface MultiInputFieldProps {
  name: string;
  control: any;
  placeholder?: string;
  inputClassName?: string;
}

const MultiInputField: React.FC<MultiInputFieldProps> = ({
  name,
  control,
  placeholder,
  inputClassName,
}) => {
  const { fields, append, remove } = useFieldArray({ control, name });

  return (
    <div className="space-y-2">
      {fields.map((field, index) => (
        <div key={field.id} className="flex items-center space-x-2">
          <Controller
            control={control}
            name={`${name}.${index}`}
            render={({ field: innerField }) => (
              <Input
                {...innerField}
                placeholder={placeholder}
                className={`flex-1 border-none bg-customgreys-darkGrey p-4 ${inputClassName}`}
              />
            )}
          />
          <Button
            type="button"
            onClick={() => remove(index)}
            variant="ghost"
            size="icon"
            className="text-customgreys-dirtyGrey"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        onClick={() => append("")}
        variant="outline"
        size="sm"
        className="mt-2 text-customgreys-dirtyGrey"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Item
      </Button>
    </div>
  );
};
