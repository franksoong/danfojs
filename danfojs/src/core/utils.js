import * as tf from '@tensorflow/tfjs-node'
// import * as tf from '@tensorflow/tfjs'
import { Configs } from '../config/config'


const config = new Configs()

export class Utils {
    //remove an element from an array
    remove(arr, index) {

        let new_arr = arr.filter(function (val, i) {
            return i != index;
        });

        return new_arr;
    }

    // Returns if a value is a string
    __is_string(value) {
        return typeof value === 'string' || value instanceof String;
    }

    // Returns if a value is really a number
    __is_number(value) {
        return typeof value === 'number' && isFinite(value);
    }

    // Returns if a value is an object
    __is_object(value) {
        return value && typeof value === 'object' && value.constructor === Object;
    }


    // Returns if a value is null
    __is_null(value) {
        return value === null;
    }

    // Returns if a value is undefined
    __is_undefined(value) {
        return typeof value === 'undefined';
    }




    /**
     * Optimized version of random sampling from an array, as implemented in Python
     * 
     *
        Chooses k unique random elements from a population sequence or set.

        Returns a new list containing elements from the population while
        leaving the original population unchanged.  The resulting list is
        in selection order so that all sub-slices will also be valid random
        samples.  This allows raffle winners (the sample) to be partitioned
        into grand prize and second place winners (the subslices).

        Members of the population need not be hashable or unique.  If the
        population contains repeats, then each occurrence is a possible
        selection in the sample.

        To choose a sample in a range of integers, use range as an argument.
        This is especially fast and space efficient for sampling from a
        large population:   sample(range(10000000), 60)

        Sampling without replacement entails tracking either potential
        selections (the array) in a list or previous selections in a set.

        When the number of selections is small compared to the
        population, then tracking selections is efficient, requiring
        only a small set and an occasional reselection.  For
        a larger number of selections, the array tracking method is
        preferred since the list takes less space than the
        set and it doesn't suffer from frequent reselections.
     * 
     * @param {*} array The array to sample values from randomly
     * @param {*} num The number of elements to sample randomly
     */
    // Chooses k unique random elements from array.
    __sample_from_iter(array, k, destructive) {
        var n = array.length;

        if (k < 0 || k > n)
            throw new RangeError("Sample larger than population or is negative");

        if (destructive || n <= (k <= 5 ? 21 : 21 + Math.pow(4, Math.ceil(Math.log(k * 3, 4))))) {
            if (!destructive)
                array = Array.prototype.slice.call(array);
            for (var i = 0; i < k; i++) { // invariant: non-selected at [i,n)
                var j = i + Math.random() * (n - i) | 0;
                var x = array[i];
                array[i] = array[j];
                array[j] = x;
            }
            array.length = k; // truncate
            return array;
        } else {
            var selected = new Set();
            // eslint-disable-next-line no-empty
            while (selected.add(Math.random() * n | 0).size < k) { }
            // eslint-disable-next-line no-undef
            return Array.prototype.map.call(selected, i => population[i]);
        }
    }

    //generate integers between two set of numbers
    __range(start, end) {

        let value = tf.linspace(start, end, (end - start) + 1).arraySync();
        return value;
    }

    //check if key is in object
    __key_in_object(object, key) {
        if (Object.prototype.hasOwnProperty.call(object, key)) {
            return true
        } else {
            return false
        }
    }

    //transpose row array into column wise array
    __get_col_values(data) {
        let row_len = data.length
        let cols_len = data[0].length
        var cols_arr = []
        for (var i = 0; i <= cols_len - 1; i++) {
            let temp_col = []
            for (let j = 0; j < row_len; j++) {
                temp_col.push(data[j][i])
            }
            cols_arr.push(temp_col)
        }
        return cols_arr

    }

    // let data = [{ alpha: ["A", "B", "C", "D"] }, { count: [1,2,3,4]}, {sum: [20.3, 30.456, 40.90, 90.1]}]


    //transpose column array into row array
    __get_row_values(data) {
        let rows_len = Object.values(data[0])[0].length
        let cols_len = data.length
        var rows_arr = []

        for (var i = 0; i <= rows_len - 1; i++) {
            var temp_row = []
            for (let j = 0; j < cols_len; j++) {
                let _arr = Object.values(data[j])[0]
                temp_row.push(_arr[i])
            }
            rows_arr.push(temp_row)
        }
        //get column names
        let col_names = []
        for (let i = 0; i < cols_len; i++) {
            let _key = Object.keys(data[i])[0]
            col_names.push(_key)

        }

        return [rows_arr, col_names]

    }


    //converts a 2D array of array to 1D for Series Class
    __convert_2D_to_1D(data) {
        let new_data = []
        data.map(val => {
            if (this.__is_object(val)) {
                new_data.push(JSON.stringify(val))
            } else {
                new_data.push(`${val}`)

            }
        })
        return new_data
    }


    __replace_undefined_with_NaN(data, isSeries) {
        if (isSeries) {
            let temp_arr = []
            data.map(val => {
                if (typeof val === 'undefined' || val == Infinity) {
                    temp_arr.push(NaN)
                } else {
                    temp_arr.push(val)
                }
            })
            return temp_arr
        } else {
            let full_arr = []
            data.map(val => {
                var temp_arr = []
                val.map(ele => {
                    if (typeof ele === 'undefined' || val == Infinity) {
                        temp_arr.push(NaN)
                    } else {
                        temp_arr.push(ele)
                    }
                })
                full_arr.push(temp_arr)
            })
            return full_arr
        }

    }

    //infer types from an array of array
    __get_t(arr) {
        if (this.__is_1D_array(arr)) {
            const dtypes = []
            let int_tracker = []
            let float_tracker = []
            let string_tracker = []
            let bool_tracker = []
            let lim;

            if (arr.length < config.get_dtype_test_lim) {
                lim = arr.length - 1
            } else {
                lim = config.get_dtype_test_lim - 1
            }
            arr.forEach((ele, indx) => {
                let count = indx
                if (typeof ele == 'boolean') {
                    float_tracker.push(false)
                    int_tracker.push(false)
                    string_tracker.push(false)
                    bool_tracker.push(true)
                } else if (!isNaN(Number(ele))) {

                    if (ele.toString().includes(".")) {
                        float_tracker.push(true)
                        int_tracker.push(false)
                        string_tracker.push(false)
                        bool_tracker.push(false)
                    } else {
                        float_tracker.push(false)
                        int_tracker.push(true)
                        string_tracker.push(false)
                        bool_tracker.push(false)

                    }
                } else {
                    float_tracker.push(false)
                    int_tracker.push(false)
                    string_tracker.push(true)
                    bool_tracker.push(false)
                }

                if (count == lim) {
                    //if atleast one string appears return string dtype
                    const even = (element) => element == true;
                    if (string_tracker.some(even)) {
                        dtypes.push("string")
                    } else if (float_tracker.some(even)) {
                        dtypes.push("float32")
                    } else if (int_tracker.some(even)) {
                        dtypes.push("int32")
                    } else if (bool_tracker.some(even)) {
                        dtypes.push("boolean")
                    } else {
                        dtypes.push("undefined")
                    }
                }
            })

            return dtypes

        } else {
            const dtypes = []
            let lim;
            if (arr[0].length < config.get_dtype_test_lim) {
                lim = arr[0].length - 1
            } else {
                lim = config.get_dtype_test_lim - 1
            }
            arr.forEach((ele) => {
                let int_tracker = []
                let float_tracker = []
                let string_tracker = []
                let bool_tracker = []

                ele.forEach((ele, indx) => {
                    let count = indx
                    if (typeof ele == 'boolean') {
                        float_tracker.push(false)
                        int_tracker.push(false)
                        string_tracker.push(false)
                        bool_tracker.push(true)
                    } else if (!isNaN(Number(ele))) {

                        if (ele.toString().includes(".")) {
                            float_tracker.push(true)
                            int_tracker.push(false)
                            string_tracker.push(false)
                            bool_tracker.push(false)
                        } else {
                            float_tracker.push(false)
                            int_tracker.push(true)
                            string_tracker.push(false)
                            bool_tracker.push(false)

                        }
                    } else {
                        float_tracker.push(false)
                        int_tracker.push(false)
                        string_tracker.push(true)
                        bool_tracker.push(false)
                    }

                    if (count == lim) {
                        //if atleast one string appears return string dtype
                        const even = (element) => element == true;
                        if (string_tracker.some(even)) {
                            dtypes.push("string")
                        } else if (float_tracker.some(even)) {
                            dtypes.push("float32")
                        } else if (int_tracker.some(even)) {
                            dtypes.push("int32")
                        } else if (bool_tracker.some(even)) {
                            dtypes.push("boolean")
                        } else {
                            dtypes.push("undefined")
                        }
                    }
                })

            });

            return dtypes
        }
    }


    __unique(data) {
        let unique = new Set()

        data.map(function (val) {
            unique.add(val[0]);
        });

        let unique_array = Array.from(unique)

        return unique_array;
    }

    //second version of In object
    __in_object(object, key, message) {

        if (!Object.prototype.hasOwnProperty.call(object, key)) {
            throw new Error(message);
        }
    }

    //check if a array is 1D
    __is_1D_array(arr) {
        if ((typeof (arr[0]) == "number") || (typeof (arr[0]) == "string") || (typeof (arr[0]) == "boolean")) {
            return true
        } else {
            return false
        }
    }

    //converts an array to object with index as value
    __arr_to_obj(arr) {
        let arr_map = {}
        arr.forEach((ele, i) => {
            arr_map[ele] = i
        })
        return arr_map
    }

    //count the NaN and non-NaN values present in an array
    __count_nan(arr, val = true, isSeries) {
        if (isSeries) {
            let null_count = 0
            let val_count = 0
            arr.map(ele => {
                if (Number.isNaN(ele)) {
                    null_count = null_count + 1
                } else {
                    val_count = val_count + 1
                }
            })
            if (val) {
                return val_count
            } else {
                return null_count
            }
        } else {
            let result_arr = []
            arr.map(ele_arr => {
                let null_count = 0
                let val_count = 0
                ele_arr.map(ele => {
                    if (Number.isNaN(ele)) {
                        null_count = null_count + 1
                    } else {
                        val_count = val_count + 1
                    }
                })
                if (val) {
                    result_arr.push(val_count)
                } else {
                    result_arr.push(null_count)
                }
            })
            return result_arr

        }
    }

    //computes the median of an array
    __median(arr, isSeries) {
        if (isSeries) {
            const sorted = arr.slice().sort((a, b) => a - b);
            const middle = Math.floor(sorted.length / 2);

            if (sorted.length % 2 === 0) {
                return (sorted[middle - 1] + sorted[middle]) / 2;
            }

            return sorted[middle];
        } else {
            let result_arr = []
            arr.map(ele => {
                const sorted = ele.slice().sort((a, b) => a - b);
                const middle = Math.floor(sorted.length / 2);

                if (sorted.length % 2 === 0) {
                    result_arr.push((sorted[middle - 1] + sorted[middle]) / 2)
                } else {
                    result_arr.push(sorted[middle])
                }

            })
            return result_arr
        }

    }


    //computes the mode(s) of an array
    __mode(arr) {
        var modes = [], count = [], i, maxIndex = 0;

        arr.map(val => {
            count[val] = (count[val] || 0) + 1;
            if (count[val] > maxIndex) {
                maxIndex = count[val];
            }
        })


        for (i in count)
            if (this.__key_in_object(count, i)) {
                if (count[i] === maxIndex) {
                    modes.push(Number(i));
                }
            }


        return modes;

    }

    //round elements of an array to ndp
    __round(arr, dp = 2, isSeries) {
        if (dp < 0) {
            dp = 1
        }
        if (isSeries) {

            let new_arr = []
            arr.map(val => {
                new_arr.push(Number(val.toFixed(dp)))
            })

            return new_arr
        } else {
            let result_arr = []
            arr.map(arr_ele => {
                let new_arr = []
                arr_ele.map(val => {
                    new_arr.push(Number(val.toFixed(dp)))
                })
                result_arr.push(new_arr)
            })
            return result_arr
        }

    }

    //check a variable is a function
    __is_function(variable) {

        return typeof variable == "function"
    }



    //generate a random list
    __randgen(num, start, end) {

        let gen_num = []

        //random int
        function randi(a, b) { return Math.floor(Math.random() * (b - a) + a); }

        function recursive(val, arr) {
            if (!arr.includes(val)) {
                return val
            }

            val = randi(start, end);

            recursive(val, arr);
        }

        for (let i = 0; i < num; i++) {

            let gen_val = randi(start, end)
            let recur_val = recursive(gen_val, gen_num);
            gen_num.push(recur_val)
        }

        return gen_num;
    }
}


