import { View, Text, TouchableOpacity, Image } from 'react-native'
import React from 'react'
import { ButtonProps } from '@/types/type';

const getBgVarientStyle = (varient: ButtonProps["bgVariant"]) => {
    switch (varient) {
 
        case 'secondary':
            return 'bg-gray-500'
        case 'success':
            return 'bg-green-500'
        case 'danger':
            return 'bg-red-500'
        case 'outline':
            return 'bg-tansparent border-neutral-300 border-[0.5px]';
        default:
            return 'bg-[#0286ff]'
    }
};


const getTextVariantStyle=(variant: ButtonProps["textVariant"]) => {
    switch (variant) {
        case 'primary':
            return "text-black font-normal"
        case 'secondary':
            return 'text-gray-100'
        case 'success':
            return 'text-green-100'
        case 'danger':
            return 'text-red-100'
        default:
            return 'text-white'
    }
}




const CustomButton = (
    {
        onPress,
        title,
        bgVariant = 'primary',
        textVariant = 'default',
        IconLeft,
        IconRight,
        className,
        ...props

    }: ButtonProps) => (
    
    
            
    

    <TouchableOpacity
        onPress={onPress}
        className={` rounded-full flex flex-row justify-center items-center shadow-md shadow-neutral-400/70 p-3 ${getBgVarientStyle(bgVariant)} ${className}` }{...props}
    >
        {IconLeft && (
            <View className="mr-4">
                <Image source={ IconLeft} className='cover w-6 h-6' />
            </View>
        )}
    
        <Text className={`text-lg font-bold ${getTextVariantStyle(textVariant)} `}>{title}</Text>
       
          
          

    </TouchableOpacity>
);





export default CustomButton